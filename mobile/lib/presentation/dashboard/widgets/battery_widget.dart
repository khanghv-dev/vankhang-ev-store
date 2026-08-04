import 'package:flutter/material.dart';

class BatteryWidget extends StatefulWidget {
  final double percentage;
  final bool isCharging;
  final double height;
  final double width;

  const BatteryWidget({
    super.key,
    required this.percentage,
    required this.isCharging,
    this.height = 110,
    this.width = 220,
  });

  @override
  State<BatteryWidget> createState() => _BatteryWidgetState();
}

class _BatteryWidgetState extends State<BatteryWidget> with SingleTickerProviderStateMixin {
  late AnimationController _animationController;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );

    if (widget.isCharging) {
      _animationController.repeat();
    }
  }

  @override
  void didUpdateWidget(covariant BatteryWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isCharging && !_animationController.isAnimating) {
      _animationController.repeat();
    } else if (!widget.isCharging && _animationController.isAnimating) {
      _animationController.stop();
    }
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  // Get color based on battery percentage
  Color _getBatteryColor(double pct) {
    if (pct < 20) {
      return const Color(0xFFEF4444); // Bright Crimson
    } else if (pct < 50) {
      return const Color(0xFFF59E0B); // Warm Amber
    } else {
      return const Color(0xFF10B981); // Emerald Green
    }
  }

  @override
  Widget build(BuildContext context) {
    final clampedPct = widget.percentage.clamp(0.0, 100.0);
    final batteryColor = _getBatteryColor(clampedPct);

    return Container(
      width: widget.width,
      height: widget.height,
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B).withOpacity(0.08),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: Colors.white.withOpacity(0.15),
          width: 1.5,
        ),
      ),
      child: Stack(
        alignment: Alignment.centerLeft,
        children: [
          Row(
            children: [
              // Battery Outer Border & Casing
              Expanded(
                child: Container(
                  height: widget.height - 20,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: const Color(0xFF475569),
                      width: 3.5,
                    ),
                  ),
                  padding: const EdgeInsets.all(4),
                  alignment: Alignment.centerLeft,
                  child: AnimatedBuilder(
                    animation: _animationController,
                    builder: (context, child) {
                      return LayoutBuilder(
                        builder: (context, constraints) {
                          final maxWidth = constraints.maxWidth;
                          final fillWidth = maxWidth * (clampedPct / 100.0);

                          return Container(
                            width: fillWidth,
                            height: double.infinity,
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(6),
                              gradient: LinearGradient(
                                colors: widget.isCharging
                                    ? [
                                        batteryColor.withOpacity(0.85),
                                        batteryColor,
                                        const Color(0xFF38BDF8), // Light Blue/Sky highlight
                                        batteryColor,
                                      ]
                                    : [
                                        batteryColor.withOpacity(0.85),
                                        batteryColor,
                                      ],
                                stops: widget.isCharging
                                    ? [
                                        0.0,
                                        (_animationController.value - 0.25).clamp(0.0, 1.0),
                                        _animationController.value,
                                        (_animationController.value + 0.25).clamp(0.0, 1.0),
                                      ]
                                    : [0.0, 1.0],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: batteryColor.withOpacity(0.35),
                                  blurRadius: 10,
                                  spreadRadius: 1,
                                ),
                              ],
                            ),
                          );
                        },
                      );
                    },
                  ),
                ),
              ),
              const SizedBox(width: 4),
              // Battery Terminal Tip
              Container(
                width: 7,
                height: 24,
                decoration: const BoxDecoration(
                  color: Color(0xFF475569),
                  borderRadius: BorderRadius.only(
                    topRight: Radius.circular(4),
                    bottomRight: Radius.circular(4),
                  ),
                ),
              ),
            ],
          ),
          
          // Charging/Discharging Overlay Content
          Positioned.fill(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (widget.isCharging) ...[
                  AnimatedBuilder(
                    animation: _animationController,
                    builder: (context, child) {
                      final scale = 1.0 + (0.15 * _animationController.value);
                      return Transform.scale(
                        scale: scale,
                        child: const Icon(
                          Icons.flash_on,
                          color: Colors.white,
                          size: 24,
                          shadows: [
                            Shadow(
                              color: Colors.black38,
                              blurRadius: 4,
                              offset: Offset(0, 1),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                  const SizedBox(width: 4),
                ],
                Text(
                  '${clampedPct.toStringAsFixed(0)}%',
                  style: const TextStyle(
                    color: Color(0xFF0F172A),
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -0.5,
                    shadows: [
                      Shadow(
                        color: Colors.white70,
                        blurRadius: 8,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
