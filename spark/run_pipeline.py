import os
import sys
import subprocess
import datetime
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq
from pymongo import MongoClient
import psycopg2

def main():
    target_date_str = datetime.datetime.now().strftime("%Y-%m-%d")
    if len(sys.argv) > 1:
        target_date_str = sys.argv[1]
    
    print(f"=== Starting VinFast Battery Telemetry Pipeline for Date: {target_date_str} ===")
    
    # 1. Connect to MongoDB and fetch raw telemetry
    print("Connecting to MongoDB...")
    mongo_client = MongoClient("mongodb://localhost:27017")
    db = mongo_client["VinFastO2O_Telemetry"]
    collection = db["raw_telemetry_queue"]
    
    # Query all telemetry data
    print("Fetching raw telemetry records from MongoDB...")
    cursor = collection.find({})
    records = list(cursor)
    print(f"Found {len(records)} telemetry records in MongoDB.")
    
    if len(records) == 0:
        print("No telemetry records found. Inserting dummy records for demonstration...")
        # Insert dummy telemetry data to test the end-to-end flow
        dummy_records = [
            {
                "vin": "VNF-KLARAS-2026-08173",
                "latitude": 21.0285,
                "longitude": 105.8542,
                "speed": 35.5,
                "batteryPercentage": 85.0,
                "batteryTemperature": 38.5,
                "timestampUnix": int(datetime.datetime.now().timestamp()) - 3600,
                "isCharging": False
            },
            {
                "vin": "VNF-KLARAS-2026-08173",
                "latitude": 21.0295,
                "longitude": 105.8552,
                "speed": 40.0,
                "batteryPercentage": 84.0,
                "batteryTemperature": 39.0,
                "timestampUnix": int(datetime.datetime.now().timestamp()) - 1800,
                "isCharging": False
            },
            {
                "vin": "VNF-KLARAS-2026-08173",
                "latitude": 21.0305,
                "longitude": 105.8562,
                "speed": 45.0,
                "batteryPercentage": 82.5,
                "batteryTemperature": 56.5,  # High temperature anomaly (>55)
                "timestampUnix": int(datetime.datetime.now().timestamp()),
                "isCharging": False
            },
            {
                "vin": "VNF-EV-DEMO-9999",
                "latitude": 10.7769,
                "longitude": 106.7009,
                "speed": 15.0,
                "batteryPercentage": 70.0,
                "batteryTemperature": 34.0,
                "timestampUnix": int(datetime.datetime.now().timestamp()) - 600,
                "isCharging": False
            }
        ]
        collection.insert_many(dummy_records)
        records = dummy_records
        print(f"Seeded {len(dummy_records)} mock telemetry records.")

    # 2. Convert to DataFrame and preprocess
    df = pd.DataFrame(records)
    if "_id" in df.columns:
        df = df.drop(columns=["_id"])
    
    # Map column names from PascalCase (C# MongoDB default) to camelCase (Spark default)
    mapping = {
        "Vin": "vin",
        "Latitude": "latitude",
        "Longitude": "longitude",
        "Speed": "speed",
        "BatteryPercentage": "batteryPercentage",
        "BatteryTemperature": "batteryTemperature",
        "TimestampUnix": "timestampUnix",
        "IsCharging": "isCharging"
    }
    df = df.rename(columns=mapping)
    
    # Map column names if different and default missing ones
    if "isCharging" not in df.columns:
        df["isCharging"] = False
    
    # Ensure correct data types for PySpark SparkSession parquet reader
    df["vin"] = df["vin"].astype(str)
    df["latitude"] = df["latitude"].astype(float)
    df["longitude"] = df["longitude"].astype(float)
    df["speed"] = df["speed"].astype(float)
    df["batteryPercentage"] = df["batteryPercentage"].astype(float)
    df["batteryTemperature"] = df["batteryTemperature"].astype(float)
    df["timestampUnix"] = df["timestampUnix"].astype(int)
    df["isCharging"] = df["isCharging"].astype(bool)

    # 3. Save to partitioned Parquet files locally
    target_date = datetime.datetime.strptime(target_date_str, "%Y-%m-%d")
    year = target_date.strftime("%Y")
    month = target_date.strftime("%m")
    day = target_date.strftime("%d")
    
    output_dir = os.path.join(os.path.dirname(__file__), "data", "telemetry", f"year={year}", f"month={month}", f"day={day}")
    os.makedirs(output_dir, exist_ok=True)
    parquet_file_path = os.path.join(output_dir, "telemetry.parquet")
    
    table = pa.Table.from_pandas(df)
    pq.write_table(table, parquet_file_path)
    print(f"Successfully exported raw telemetry to Parquet file: {parquet_file_path}")

    # 4. Trigger PySpark Job
    print("Launching Spark analysis batch job...")
    spark_script = os.path.join(os.path.dirname(__file__), "battery_health_analysis.py")
    input_path = os.path.join(os.path.dirname(__file__), "data", "telemetry")
    output_path = os.path.join(os.path.dirname(__file__), "data", "reports")
    
    spark_cmd = [
        "spark-submit",
        spark_script,
        "--date", target_date_str,
        "--input-path", input_path,
        "--output-path", output_path
    ]
    
    print(f"Running command: {' '.join(spark_cmd)}")
    try:
        subprocess.run(spark_cmd, check=True)
        print("Spark batch job executed successfully.")
    except Exception as e:
        print(f"Error running Spark job: {e}. Executing fallback analysis in Python pandas...")
        # Fallback Python analysis to make pipeline resilient without Spark installed on runner
        run_fallback_analysis(df, target_date_str, output_path)

    # 5. Read Spark Output Parquet and write to PostgreSQL
    print("Reading Spark analysis results...")
    report_partition_path = os.path.join(output_path, f"date={target_date_str}")
    if not os.path.exists(report_partition_path):
        print(f"Error: Spark output path not found: {report_partition_path}")
        return
        
    # Read output parquet files
    parquet_files = [os.path.join(report_partition_path, f) for f in os.listdir(report_partition_path) if f.endswith(".parquet")]
    if not parquet_files:
        print("No Parquet output files found in Spark report directory.")
        return
        
    report_df = pd.concat([pd.read_parquet(f) for f in parquet_files])
    print(f"Loaded {len(report_df)} health report rows from Spark output.")
    
    # 6. Save back to PostgreSQL
    print("Connecting to PostgreSQL database...")
    pg_conns = [
        "Host=localhost;Port=5433;Database=VinFastO2O_OrderDb;Username=hvk2k5;Password=odoopwd",
        "Host=localhost;Port=5433;Database=VinFastO2O_OrderDb_Dev;Username=hvk2k5;Password=odoopwd"
    ]
    
    conn = None
    for conn_str in pg_conns:
        try:
            conn = psycopg2.connect(conn_str)
            print(f"Connected to PostgreSQL using: {conn_str.split(';')[2]}")
            break
        except Exception:
            continue
            
    if conn is None:
        print("Error: Could not connect to PostgreSQL. Aborting DB sync.")
        return
        
    try:
        with conn.cursor() as cur:
            for _, row in report_df.iterrows():
                vin = row["vin"]
                max_temp = float(row["max_temp"])
                avg_temp = float(row["avg_temp"])
                temp_anomalies_count = int(row["temp_anomalies_count"])
                total_records = int(row["total_records"])
                avg_discharge_rate = float(row["avg_discharge_rate"]) if pd.notnull(row["avg_discharge_rate"]) else None
                soh = float(row["soh"])
                is_risky = bool(row["is_risky"])
                analysis_date = str(row["analysis_date"])
                
                # Upsert query
                upsert_query = """
                INSERT INTO battery_health_reports 
                (vin, max_temp, avg_temp, temp_anomalies_count, total_records, avg_discharge_rate, soh, is_risky, analysis_date, processed_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                ON CONFLICT (vin) DO UPDATE SET
                    max_temp = EXCLUDED.max_temp,
                    avg_temp = EXCLUDED.avg_temp,
                    temp_anomalies_count = EXCLUDED.temp_anomalies_count,
                    total_records = EXCLUDED.total_records,
                    avg_discharge_rate = EXCLUDED.avg_discharge_rate,
                    soh = EXCLUDED.soh,
                    is_risky = EXCLUDED.is_risky,
                    analysis_date = EXCLUDED.analysis_date,
                    processed_at = CURRENT_TIMESTAMP;
                """
                cur.execute(upsert_query, (vin, max_temp, avg_temp, temp_anomalies_count, total_records, avg_discharge_rate, soh, is_risky, analysis_date))
        conn.commit()
        print("Successfully synced all Spark battery health records to PostgreSQL.")
    except Exception as db_err:
        print(f"Database sync error: {db_err}")
    finally:
        conn.close()

def run_fallback_analysis(df, target_date_str, output_path):
    print("Running Python fallback analysis (equivalent to Spark Job)...")
    results = []
    for vin, group in df.groupby("vin"):
        group = group.sort_values("timestampUnix")
        max_temp = group["batteryTemperature"].max()
        avg_temp = group["batteryTemperature"].mean()
        temp_anomalies = int((group["batteryTemperature"] > 55.0).sum())
        total_records = len(group)
        
        # Simple discharge rate calculation
        group["prev_percentage"] = group["batteryPercentage"].shift(1)
        group["prev_timestamp"] = group["timestampUnix"].shift(1)
        group["delta_percentage"] = group["prev_percentage"] - group["batteryPercentage"]
        group["delta_time"] = group["timestampUnix"] - group["prev_timestamp"]
        
        valid_discharge = group[
            (group["isCharging"] == False) &
            (group["speed"] > 0) &
            (group["delta_percentage"] >= 0) &
            (group["delta_time"] > 0) &
            (group["delta_time"] < 300)
        ]
        
        if len(valid_discharge) > 0:
            avg_discharge_rate = (valid_discharge["delta_percentage"] / valid_discharge["delta_time"]).mean()
        else:
            avg_discharge_rate = None
            
        nominal_discharge_rate = 0.00694
        soh = 100.0
        if avg_discharge_rate is not None and avg_discharge_rate > nominal_discharge_rate:
            soh -= (avg_discharge_rate - nominal_discharge_rate) * 6000.0
        soh -= (temp_anomalies * 0.2)
        soh = max(0.0, min(100.0, soh))
        
        is_risky = (soh < 75.0) or (max_temp > 55.0) or (avg_discharge_rate is not None and avg_discharge_rate > 0.02)
        
        results.append({
            "vin": vin,
            "max_temp": max_temp,
            "avg_temp": avg_temp,
            "temp_anomalies_count": temp_anomalies,
            "total_records": total_records,
            "avg_discharge_rate": avg_discharge_rate,
            "soh": soh,
            "is_risky": is_risky,
            "analysis_date": target_date_str,
            "processed_at": datetime.datetime.now().isoformat()
        })
        
    result_df = pd.DataFrame(results)
    dest_dir = os.path.join(output_path, f"date={target_date_str}")
    os.makedirs(dest_dir, exist_ok=True)
    table = pa.Table.from_pandas(result_df)
    pq.write_table(table, os.path.join(dest_dir, "part-0.parquet"))
    print("Fallback analysis complete. Saved fallback parquet reports.")

if __name__ == "__main__":
    main()
