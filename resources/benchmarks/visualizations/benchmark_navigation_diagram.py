#!/usr/bin/env python3
"""
Benchmark Navigation Diagram

This script generates an infographic showing how to navigate the benchmark system,
highlighting the relationships between different benchmark files and resources.
"""

import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np
import os

# Set up the output directory
script_dir = os.path.dirname(os.path.abspath(__file__))
output_dir = script_dir
os.makedirs(output_dir, exist_ok=True)

# Create figure and axis
fig, ax = plt.subplots(figsize=(14, 10))

# Remove axis ticks and spines
ax.set_xticks([])
ax.set_yticks([])
for spine in ax.spines.values():
    spine.set_visible(False)

# Set background color
fig.patch.set_facecolor('#f5f5f5')
ax.set_facecolor('#f5f5f5')

# --- Draw the main components ---

# Colors
main_color = '#3498db'  # Blue
chapter_color = '#2ecc71'  # Green
resource_color = '#9b59b6'  # Purple
reader_color = '#e74c3c'  # Red

# Main Index box
index_box = patches.FancyBboxPatch(
    (2, 7.5), 3, 1.5, boxstyle=patches.BoxStyle("Round", pad=0.6),
    facecolor=main_color, alpha=0.8, edgecolor='black', linewidth=2
)
ax.add_patch(index_box)
ax.text(3.5, 8.25, 'Benchmark Index', ha='center', va='center', 
        fontsize=16, fontweight='bold', color='white')
ax.text(3.5, 7.85, 'Central navigation guide\nfor all benchmarks', 
        ha='center', va='center', fontsize=10, color='white')

# Supporting Resources
# Visualization Guidelines
vis_box = patches.FancyBboxPatch(
    (7, 8), 2.5, 1, boxstyle=patches.BoxStyle("Round", pad=0.6),
    facecolor=resource_color, alpha=0.8, edgecolor='black', linewidth=1.5
)
ax.add_patch(vis_box)
ax.text(8.25, 8.5, 'Visualization Guidelines', ha='center', va='center', 
        fontsize=12, fontweight='bold', color='white')

# Diagram Integration
diag_box = patches.FancyBboxPatch(
    (7, 6.5), 2.5, 1, boxstyle=patches.BoxStyle("Round", pad=0.6),
    facecolor=resource_color, alpha=0.8, edgecolor='black', linewidth=1.5
)
ax.add_patch(diag_box)
ax.text(8.25, 7, 'Benchmark-Diagram\nIntegration', ha='center', va='center', 
        fontsize=12, fontweight='bold', color='white')

# Chapter Benchmark Files
chapters = [
    "Ch 1: Developer Productivity",
    "Ch 2: Architecture Performance",
    "Ch 3: Interaction Layer",
    "Ch 4: Tool Management",
    "Ch 5: Resource Interaction",
    "Ch 6: Memory Retrieval",
    "Ch 7: Operation Pipeline",
    "Ch 8: Error Handling",
    "Ch 9: Optimization Techniques",
    "Ch 10: Framework Performance",
    "Ch 11: Use Cases",
    "Ch 12: Future Directions"
]

# Draw chapter boxes in a grid (4x3)
row_positions = [5, 3.5, 2, 0.5]
col_positions = [1, 4, 7, 10]

chapter_boxes = []
for i, chapter in enumerate(chapters):
    row = i // 3
    col = i % 3
    
    x = col_positions[col]
    y = row_positions[row]
    
    box = patches.FancyBboxPatch(
        (x, y), 2.5, 1, boxstyle=patches.BoxStyle("Round", pad=0.3),
        facecolor=chapter_color, alpha=0.7, edgecolor='black', linewidth=1
    )
    ax.add_patch(box)
    ax.text(x+1.25, y+0.5, chapter, ha='center', va='center', 
            fontsize=10, fontweight='bold', color='white')
    chapter_boxes.append(box)

# Reader Profiles
readers = [
    "Software Developers",
    "System Architects",
    "AI/ML Specialists"
]

reader_boxes = []
for i, reader in enumerate(readers):
    box = patches.FancyBboxPatch(
        (11, 8-i*1.2), 2, 0.8, boxstyle=patches.BoxStyle("Round", pad=0.3),
        facecolor=reader_color, alpha=0.7, edgecolor='black', linewidth=1
    )
    ax.add_patch(box)
    ax.text(12, 8-i*1.2+0.4, reader, ha='center', va='center', 
            fontsize=11, fontweight='bold', color='white')
    reader_boxes.append(box)

# --- Add connectors/arrows ---

def draw_arrow(ax, start, end, color='#2c3e50', width=0.015, style='-'):
    ax.annotate("", xy=end, xytext=start,
                arrowprops=dict(arrowstyle="->", lw=2,
                                connectionstyle="arc3,rad=0.1",
                                fc=color, ec=color))

# Connect index to chapters
for i, box in enumerate(chapter_boxes):
    start_x = 3.5
    start_y = 7.5
    
    row = i // 3
    col = i % 3
    
    end_x = col_positions[col] + 1.25
    end_y = row_positions[row] + 1
    
    # Draw different arrow paths based on position
    if col == 0:
        draw_arrow(ax, (start_x-0.5, start_y), (end_x, end_y))
    elif col == 1:
        draw_arrow(ax, (start_x, start_y-0.2), (end_x, end_y))
    else:
        draw_arrow(ax, (start_x+0.5, start_y), (end_x, end_y))

# Connect index to supporting resources
draw_arrow(ax, (5, 8.25), (7, 8.5))
draw_arrow(ax, (5, 7.85), (7, 7))

# Connect readers to index
for i, box in enumerate(reader_boxes):
    draw_arrow(ax, (11, 8-i*1.2+0.4), (5, 8.25-i*0.2))

# Connect chapters to each other with relationship lines
key_relationships = [
    (2, 5),  # Ch3 to Ch6
    (3, 4),  # Ch4 to Ch5
    (5, 6),  # Ch6 to Ch7
    (6, 7),  # Ch7 to Ch8
    (8, 9)   # Ch9 to Ch10
]

for start, end in key_relationships:
    start_row = start // 3
    start_col = start % 3
    end_row = end // 3
    end_col = end % 3
    
    start_x = col_positions[start_col] + 2.5
    start_y = row_positions[start_row] + 0.5
    
    end_x = col_positions[end_col]
    end_y = row_positions[end_row] + 0.5
    
    draw_arrow(ax, (start_x, start_y), (end_x, end_y), color='#7f8c8d')

# --- Add labels and annotations ---

# Main title
ax.text(7, 9.5, 'Unified Agentic Systems: Benchmark Navigation Guide', 
        ha='center', va='center', fontsize=20, fontweight='bold', color='#2c3e50')

# Reading levels legend
legend_colors = ['#45B39D', '#3498DB', '#8E44AD']  # Green, Blue, Purple
legend_labels = ['☘️ Basic Level', '🔷 Intermediate Level', '⬡ Advanced Level']

for i, (color, label) in enumerate(zip(legend_colors, legend_labels)):
    rect = patches.Rectangle((1+i*4, 9), 0.3, 0.3, facecolor=color)
    ax.add_patch(rect)
    ax.text(1.4+i*4, 9.15, label, va='center', fontsize=10)

# Add explanatory notes
notes = [
    "• All benchmarks follow three-tiered readability system",
    "• Chapter benchmarks contain raw data and key insights",
    "• Index shows relationships between components",
    "• Follow reading paths based on your role"
]

for i, note in enumerate(notes):
    ax.text(1, 6.8-i*0.3, note, va='center', fontsize=9, color='#2c3e50')

# Add arrows from index to reading paths
ax.text(6, 9, "↓ Navigation Paths", ha='center', fontsize=11, fontweight='bold')
ax.text(10, 9, "↓ Readability Levels", ha='center', fontsize=11, fontweight='bold')

# Save the figure
plt.tight_layout()
plt.savefig(os.path.join(output_dir, 'benchmark_navigation_guide.png'), dpi=300, bbox_inches='tight')
print(f"Navigation diagram saved to {os.path.join(output_dir, 'benchmark_navigation_guide.png')}")

plt.close()
