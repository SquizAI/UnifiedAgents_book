#!/usr/bin/env python3
"""
Memory Retrieval Performance Comparison Visualization

This script generates a bar chart comparing different memory retrieval methods
based on data from Chapter 6 memory retrieval benchmarks.
"""

import matplotlib.pyplot as plt
import numpy as np
import os

# Set up the output directory
script_dir = os.path.dirname(os.path.abspath(__file__))
output_dir = script_dir
os.makedirs(output_dir, exist_ok=True)

# Data from Chapter 6 Memory Retrieval Benchmarks
retrieval_methods = [
    'Exact Match',
    'Vector Search (Cosine)',
    'Vector Search (Dot)',
    'Vector Search (Euclidean)',
    'Hybrid (Vector + Tag)',
    'Two-Stage Retrieval'
]

# Performance metrics (in milliseconds) for different database sizes
# [10k items, 100k items, 1M items]
latency_small = [4, 12, 18, 20, 25, 30]
latency_medium = [8, 35, 40, 45, 50, 45]
latency_large = [15, 85, 95, 100, 85, 65]

# Set width of bars
barWidth = 0.25
positions1 = np.arange(len(retrieval_methods))
positions2 = [x + barWidth for x in positions1]
positions3 = [x + barWidth for x in positions2]

# Create figure
plt.figure(figsize=(12, 7))

# Create bars
plt.bar(positions1, latency_small, width=barWidth, label='10K Items', color='#3498db', edgecolor='grey')
plt.bar(positions2, latency_medium, width=barWidth, label='100K Items', color='#f39c12', edgecolor='grey')
plt.bar(positions3, latency_large, width=barWidth, label='1M Items', color='#e74c3c', edgecolor='grey')

# Add x-axis labels
plt.xlabel('Retrieval Method', fontweight='bold', fontsize=12)
plt.ylabel('Average Latency (ms)', fontweight='bold', fontsize=12)
plt.title('Memory Retrieval Performance by Method and Database Size', fontweight='bold', fontsize=14)

# Adjust x-axis ticks
plt.xticks([r + barWidth for r in range(len(retrieval_methods))], retrieval_methods, rotation=45, ha='right')

# Add legends and grid
plt.legend()
plt.grid(True, linestyle='--', alpha=0.7)

# Annotate the best performer
min_index = np.argmin(latency_large)
plt.annotate('Best for Large DBs',
             xy=(positions3[min_index], latency_large[min_index]),
             xytext=(positions3[min_index]-0.2, latency_large[min_index]+20),
             arrowprops=dict(facecolor='black', shrink=0.05, width=1.5),
             fontsize=10)

# Tight layout and save
plt.tight_layout()
plt.savefig(os.path.join(output_dir, 'memory_retrieval_comparison.png'), dpi=300)
print(f"Visualization saved to {os.path.join(output_dir, 'memory_retrieval_comparison.png')}")

# Show plot if running interactively
plt.show()
