#!/usr/bin/env python3
"""
Component Performance Heatmap Visualization

This script generates a heatmap showing the performance impact relationships
between different components of an agentic system based on the benchmark index data.
"""

import matplotlib.pyplot as plt
import numpy as np
import os
import seaborn as sns

# Set up the output directory
script_dir = os.path.dirname(os.path.abspath(__file__))
output_dir = script_dir
os.makedirs(output_dir, exist_ok=True)

# Components from the benchmark index
components = [
    'Interaction Layer', 
    'Tool Management', 
    'Resource Interaction', 
    'Memory Management',
    'Operation Pipeline', 
    'Error Handling'
]

# Impact matrix (0-5 scale, where 5 is "Very High" impact)
# Data from the cross-component benchmark relationships matrix
impact_matrix = np.array([
    [0, 4, 4, 4, 4, 3],  # Interaction Layer impact on others
    [3, 0, 5, 3, 4, 4],  # Tool Management impact on others
    [2, 4, 0, 3, 3, 4],  # Resource Interaction impact on others
    [5, 3, 3, 0, 4, 3],  # Memory Management impact on others
    [4, 4, 3, 4, 0, 4],  # Operation Pipeline impact on others
    [3, 4, 4, 2, 4, 0]   # Error Handling impact on others
])

# Create a custom colormap
cmap = sns.color_palette("YlGnBu", as_cmap=True)

# Create figure
plt.figure(figsize=(10, 8))

# Create heatmap
ax = sns.heatmap(impact_matrix, annot=True, cmap=cmap, 
            xticklabels=components, yticklabels=components,
            cbar_kws={'label': 'Performance Impact (0-5)'})

# Set labels and title
plt.title('Component Performance Impact Heatmap', fontsize=16, fontweight='bold')
plt.xlabel('Affected Component', fontsize=12)
plt.ylabel('Source Component', fontsize=12)

# Adjust layout
plt.tight_layout()

# Add annotations for key relationships
plt.text(0.05, 3.3, "Memory → Interaction: Highest Impact", 
         fontsize=9, fontweight='bold', color='white',
         bbox=dict(facecolor='gray', alpha=0.7))

plt.text(2.05, 1.3, "Tool → Resource: Critical Dependency", 
         fontsize=9, fontweight='bold', color='white',
         bbox=dict(facecolor='gray', alpha=0.7))

# Save the figure
plt.savefig(os.path.join(output_dir, 'component_performance_heatmap.png'), dpi=300)
print(f"Visualization saved to {os.path.join(output_dir, 'component_performance_heatmap.png')}")

# Show plot if running interactively
plt.show()
