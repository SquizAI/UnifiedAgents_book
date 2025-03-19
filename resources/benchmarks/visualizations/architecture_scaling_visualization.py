#!/usr/bin/env python3
"""
Architecture Scaling Visualization

This script generates a line chart showing how different architectural approaches
scale with increasing load, based on data from Chapter 2 architecture benchmarks.
"""

import matplotlib.pyplot as plt
import numpy as np
import os

# Set up the output directory
script_dir = os.path.dirname(os.path.abspath(__file__))
output_dir = script_dir
os.makedirs(output_dir, exist_ok=True)

# Data from Chapter 2 Architectural Performance Benchmarks
concurrent_users = [1, 5, 10, 25, 50, 100, 250, 500]

# Response times (ms) for different architectures under increasing load
monolithic = [180, 195, 220, 320, 580, 1250, 3500, 7800]
microservices = [280, 290, 310, 380, 500, 850, 1600, 2800]
hybrid = [210, 225, 245, 350, 450, 700, 1500, 3200]
event_driven = [230, 240, 255, 320, 420, 680, 1350, 2500]
plugin_based = [190, 205, 230, 310, 480, 950, 2400, 5100]

# Create figure
plt.figure(figsize=(12, 8))

# Define line styles and colors
styles = {
    'Monolithic': {'color': '#e74c3c', 'marker': 'o', 'linestyle': '-', 'linewidth': 2},
    'Microservices': {'color': '#3498db', 'marker': 's', 'linestyle': '-', 'linewidth': 2},
    'Hybrid': {'color': '#2ecc71', 'marker': '^', 'linestyle': '-', 'linewidth': 2},
    'Event-driven': {'color': '#9b59b6', 'marker': 'D', 'linestyle': '-', 'linewidth': 2},
    'Plugin-based': {'color': '#f39c12', 'marker': 'X', 'linestyle': '-', 'linewidth': 2}
}

# Plot the lines
plt.plot(concurrent_users, monolithic, **styles['Monolithic'], label='Monolithic')
plt.plot(concurrent_users, microservices, **styles['Microservices'], label='Microservices')
plt.plot(concurrent_users, hybrid, **styles['Hybrid'], label='Hybrid')
plt.plot(concurrent_users, event_driven, **styles['Event-driven'], label='Event-driven')
plt.plot(concurrent_users, plugin_based, **styles['Plugin-based'], label='Plugin-based')

# Use logarithmic scale for better visualization
plt.xscale('log')
plt.yscale('log')

# Add grid
plt.grid(True, which="both", ls="--", alpha=0.3)

# Add labels and title
plt.xlabel('Concurrent Users', fontsize=12, fontweight='bold')
plt.ylabel('Response Time (ms)', fontsize=12, fontweight='bold')
plt.title('Architecture Scaling Characteristics', fontsize=16, fontweight='bold')

# Add legend
plt.legend(loc='upper left', fontsize=10)

# Mark scaling breakpoints
plt.axvline(x=50, color='gray', linestyle='--', alpha=0.5)
plt.text(55, 200, 'Scaling\nBreakpoint', fontsize=10, color='gray')

# Add annotations for key insights
plt.annotate('Best for Small Scale',
             xy=(5, monolithic[1]),
             xytext=(3, 120),
             arrowprops=dict(facecolor='black', shrink=0.05, width=1),
             fontsize=10)

plt.annotate('Best for Large Scale',
             xy=(250, microservices[6]),
             xytext=(280, 1000),
             arrowprops=dict(facecolor='black', shrink=0.05, width=1),
             fontsize=10)

# Add performance zones
plt.axhspan(0, 300, alpha=0.2, color='green', label='Good Performance')
plt.axhspan(300, 1000, alpha=0.2, color='yellow', label='Acceptable Performance')
plt.axhspan(1000, 10000, alpha=0.2, color='red', label='Poor Performance')

# Tight layout and save
plt.tight_layout()
plt.savefig(os.path.join(output_dir, 'architecture_scaling.png'), dpi=300)
print(f"Visualization saved to {os.path.join(output_dir, 'architecture_scaling.png')}")

# Show plot if running interactively
plt.show()
