import sys
import argparse
from datetime import datetime
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, lag, avg, max, min, sum, count, when, lit, greatest, least
from pyspark.sql.window import Window

def main():
    parser = argparse.ArgumentParser(description="VinFast Battery Health Real-time & Batch Analytics Job")
    parser.add_index = False
    
    parser.add_argument(
        "--date",
        type=str,
        default=datetime.now().strftime("%Y-%m-%d"),
        help="Date to analyze in YYYY-MM-DD format (defaults to today)"
    )
    
    parser.add_argument(
        "--input-path",
        type=str,
        default="hdfs:///vinfast/telemetry",
        help="Base HDFS or local directory path for raw telemetry logs"
    )
    
    parser.add_argument(
        "--output-path",
        type=str,
        default="hdfs:///vinfast/analytics/battery_health",
        help="Base HDFS or local directory path for analytical health reports"
    )

    args = parser.parse_args()

    # Parse target date
    try:
        target_date = datetime.strptime(args.date, "%Y-%m-%d")
    except ValueError:
        print(f"Error: Invalid date format '{args.date}'. Must be YYYY-MM-DD.")
        sys.exit(1)

    year = target_date.strftime("%Y")
    month = target_date.strftime("%m")
    day = target_date.strftime("%d")

    # Initialize Spark Session
    spark = SparkSession.builder \
        .appName("VinFast-Battery-Health-Analysis") \
        .config("spark.sql.shuffle.partitions", "20") \
        .config("spark.sql.session.timeZone", "UTC") \
        .getOrCreate()

    print(f"Starting battery health batch analysis for date: {args.date}")
    
    # Construct input partition path (handling both HDFS schema and local file paths)
    partition_path = f"{args.input_path}/year={year}/month={month}/day={day}/*.parquet"
    print(f"Reading telemetry logs from path: {partition_path}")

    try:
        # Load partition data
        telemetry_df = spark.read.parquet(partition_path)
    except Exception as e:
        print(f"Error: Unable to load data from {partition_path}. Detail: {e}")
        print("Note: If running in a development environment, verify input path exists.")
        spark.stop()
        sys.exit(0) # Exit gracefully so scheduling tools don't alert on empty daily data

    # ─── 1. Sequential Telemetry Calculation ───
    # Window specification grouped by VIN and sorted by telemetry timeline
    vin_window = Window.partitionBy("vin").orderBy("timestampUnix")

    # Get lag values to compute transitions
    telemetry_with_lags = telemetry_df \
        .withColumn("prev_percentage", lag("batteryPercentage", 1).over(vin_window)) \
        .withColumn("prev_timestamp", lag("timestampUnix", 1).over(vin_window))

    # Calculate rate of discharge (battery percentage consumed per second)
    # Filter conditions for active discharging:
    # - Vehicle is moving (speed > 0)
    # - Battery is discharging (isCharging is False)
    # - Delta percentage is positive (battery percentage dropped)
    # - Elapsed time between packets is valid (0 < delta_time < 300s to avoid gaps when vehicle was powered off)
    telemetry_discharge = telemetry_with_lags \
        .withColumn("delta_percentage", col("prev_percentage") - col("batteryPercentage")) \
        .withColumn("delta_time", col("timestampUnix") - col("prev_timestamp")) \
        .filter(
            (col("isCharging") == False) &
            (col("speed") > 0) &
            (col("delta_percentage") >= 0) &
            (col("delta_time") > 0) &
            (col("delta_time") < 300)
        ) \
        .withColumn("discharge_rate", col("delta_percentage") / col("delta_time"))

    # ─── 2. Aggregations ───
    # Aggregate average discharge rate per VIN
    discharge_metrics = telemetry_discharge.groupBy("vin").agg(
        avg("discharge_rate").alias("avg_discharge_rate")
    )

    # General telemetry metrics (Max Temp, Avg Temp, Temp Anomalies) per VIN
    general_metrics = telemetry_df.groupBy("vin").agg(
        max("batteryTemperature").alias("max_temp"),
        avg("batteryTemperature").alias("avg_temp"),
        sum(when(col("batteryTemperature") > 55.0, 1).otherwise(0)).alias("temp_anomalies_count"),
        count("vin").alias("total_records")
    )

    # Combine metrics
    analyzed_df = general_metrics.join(discharge_metrics, "vin", "left_outer")

    # ─── 3. State of Health (SOH) Math & Risk Scoring ───
    # Healthy nominal discharge rate: a battery fully discharging (100% to 0%) in 4 hours
    # 100% / (4 * 3600 seconds) = 0.00694% per second
    nominal_discharge_rate = 0.00694

    # Calculate Health Rate (SOH %):
    # - Start from 100% base
    # - Penalize faster discharge rates (multiplied by coefficient 6000 to scale impact)
    # - Deduct points for temperature anomalies (0.2% SOH deduction per packet over 55°C)
    soh_calculation = (
        lit(100.0) -
        when(
            col("avg_discharge_rate").isNotNull() & (col("avg_discharge_rate") > nominal_discharge_rate),
            (col("avg_discharge_rate") - nominal_discharge_rate) * 6000.0
        ).otherwise(lit(0.0)) -
        (col("temp_anomalies_count") * 0.2)
    )

    # Clamp SOH between 0.0% and 100.0%
    analyzed_df = analyzed_df.withColumn(
        "soh",
        greatest(lit(0.0), least(lit(100.0), soh_calculation))
    )

    # Flag batteries with high failure risk:
    # - State of Health falls below 75%
    # - Maximum recorded core temperature exceeded 55°C
    # - Average discharge rate exceeds critical threshold (> 0.02% per sec, equivalent to draining in under 1.4 hours)
    analyzed_df = analyzed_df.withColumn(
        "is_risky",
        (col("soh") < 75.0) |
        (col("max_temp") > 55.0) |
        (col("avg_discharge_rate") > 0.02)
    )

    # Add analysis metadata
    final_report = analyzed_df \
        .withColumn("analysis_date", lit(args.date)) \
        .withColumn("processed_at", lit(datetime.now().isoformat()))

    # Write output back to date-partitioned folder
    destination = f"{args.output_path}/date={args.date}"
    print(f"Writing health analysis report to HDFS destination: {destination}")
    
    final_report.write \
        .mode("overwrite") \
        .parquet(destination)

    print("Spark analysis batch job completed successfully.")
    
    # Print a summary of identified risks
    risky_count = final_report.filter(col("is_risky") == True).count()
    total_count = final_report.count()
    print(f"Summary: Found {risky_count} risky battery packs out of {total_count} total units analyzed.")

    spark.stop()

if __name__ == "__main__":
    main()
