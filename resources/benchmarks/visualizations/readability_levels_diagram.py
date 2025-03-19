#!/usr/bin/env python3
"""
Readability Levels Diagram

This script generates an infographic explaining the three-tiered readability system
used throughout the benchmark documents.
"""

import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np
import os
from matplotlib.path import Path

# Set up the output directory
script_dir = os.path.dirname(os.path.abspath(__file__))
output_dir = script_dir
os.makedirs(output_dir, exist_ok=True)

# Create figure and axis
fig, ax = plt.subplots(figsize=(10, 8))

# Remove axis ticks and spines
ax.set_xticks([])
ax.set_yticks([])
for spine in ax.spines.values():
    spine.set_visible(False)

# Set background color
fig.patch.set_facecolor('#f9f9f9')
ax.set_facecolor('#f9f9f9')

# --- Define colors ---
basic_color = '#27ae60'      # Green
intermediate_color = '#3498db'  # Blue
advanced_color = '#8e44ad'   # Purple
connector_color = '#34495e'  # Dark slate

# --- Add title ---
ax.text(5, 7.5, 'Benchmark Readability Levels', 
        ha='center', va='center', fontsize=20, fontweight='bold', color='#2c3e50')

# --- Draw the readability pyramid ---
# Basic level (bottom)
basic_rect = patches.FancyBboxPatch(
    (1.5, 1), 7, 1.5, boxstyle=patches.BoxStyle("Round", pad=0.6),
    facecolor=basic_color, alpha=0.8, edgecolor='black', linewidth=1.5
)
ax.add_patch(basic_rect)

# Intermediate level (middle)
intermediate_rect = patches.FancyBboxPatch(
    (2, 2.75), 6, 1.5, boxstyle=patches.BoxStyle("Round", pad=0.6),
    facecolor=intermediate_color, alpha=0.8, edgecolor='black', linewidth=1.5
)
ax.add_patch(intermediate_rect)

# Advanced level (top)
advanced_rect = patches.FancyBboxPatch(
    (2.5, 4.5), 5, 1.5, boxstyle=patches.BoxStyle("Round", pad=0.6),
    facecolor=advanced_color, alpha=0.8, edgecolor='black', linewidth=1.5
)
ax.add_patch(advanced_rect)

# --- Add level labels and symbols ---
# Basic level
ax.text(2, 1.75, '☘️', fontsize=24, ha='center', va='center')
ax.text(3, 1.75, 'Basic Level', fontsize=16, fontweight='bold', color='white', ha='left', va='center')
ax.text(7.5, 1.75, 'For all readers', fontsize=12, color='white', ha='right', va='center')

# Intermediate level
ax.text(2.5, 3.5, '🔷', fontsize=24, ha='center', va='center')
ax.text(3.5, 3.5, 'Intermediate Level', fontsize=16, fontweight='bold', color='white', ha='left', va='center')
ax.text(7, 3.5, 'For practitioners', fontsize=12, color='white', ha='right', va='center')

# Advanced level
ax.text(3, 5.25, '⬡', fontsize=24, ha='center', va='center')
ax.text(4, 5.25, 'Advanced Level', fontsize=16, fontweight='bold', color='white', ha='left', va='center')
ax.text(6.5, 5.25, 'For specialists', fontsize=12, color='white', ha='right', va='center')

# --- Add audience figures on the right ---
# Silhouette for basic audience (managers, stakeholders)
basic_audience = [
    (8.5, 1.5),  # Head 
    (8.5, 1.0),  # Neck
    (8.8, 0.7),  # Shoulder
    (8.8, 0.3),  # Body
    (8.2, 0.3),  # Body
    (8.2, 0.7),  # Shoulder
    (8.5, 1.0),  # Back to neck
]
basic_shape = patches.Polygon(basic_audience, closed=True, facecolor=basic_color, alpha=0.6)
ax.add_patch(basic_shape)
ax.text(8.5, 0.1, "Decision makers\nStakeholders\nNon-technical readers", ha='center', fontsize=9, color=basic_color)

# Silhouette for intermediate audience (developers)
intermediate_audience = [
    (8.5, 3.3),  # Head 
    (8.5, 2.8),  # Neck
    (8.8, 2.5),  # Shoulder
    (8.8, 2.1),  # Body
    (8.2, 2.1),  # Body
    (8.2, 2.5),  # Shoulder
    (8.5, 2.8),  # Back to neck
]
intermediate_shape = patches.Polygon(intermediate_audience, closed=True, facecolor=intermediate_color, alpha=0.6)
ax.add_patch(intermediate_shape)
ax.text(8.5, 1.9, "Software Engineers\nSystem Architects\nImplementers", ha='center', fontsize=9, color=intermediate_color)

# Silhouette for advanced audience (specialists)
advanced_audience = [
    (8.5, 5.1),  # Head 
    (8.5, 4.6),  # Neck
    (8.8, 4.3),  # Shoulder
    (8.8, 3.9),  # Body
    (8.2, 3.9),  # Body
    (8.2, 4.3),  # Shoulder
    (8.5, 4.6),  # Back to neck
]
advanced_shape = patches.Polygon(advanced_audience, closed=True, facecolor=advanced_color, alpha=0.6)
ax.add_patch(advanced_shape)
ax.text(8.5, 3.7, "AI/ML Specialists\nPerformance Engineers\nResearchers", ha='center', fontsize=9, color=advanced_color)

# --- Add document section examples on the left ---
# Example document
doc_rect = patches.Rectangle(
    (0.5, 2), 1, 3, facecolor='white', edgecolor='gray', linewidth=1
)
ax.add_patch(doc_rect)

# Basic section in document
basic_section = patches.Rectangle(
    (0.6, 2.1), 0.8, 0.8, facecolor=basic_color, alpha=0.3, edgecolor=basic_color
)
ax.add_patch(basic_section)
ax.text(1, 2.5, "☘️", fontsize=14, ha='center', va='center')

# Intermediate section in document
intermediate_section = patches.Rectangle(
    (0.6, 3.1), 0.8, 0.8, facecolor=intermediate_color, alpha=0.3, edgecolor=intermediate_color
)
ax.add_patch(intermediate_section)
ax.text(1, 3.5, "🔷", fontsize=14, ha='center', va='center')

# Advanced section in document
advanced_section = patches.Rectangle(
    (0.6, 4.1), 0.8, 0.8, facecolor=advanced_color, alpha=0.3, edgecolor=advanced_color
)
ax.add_patch(advanced_section)
ax.text(1, 4.5, "⬡", fontsize=14, ha='center', va='center')

# Document title
ax.text(1, 5.2, "Benchmark\nDocument", ha='center', fontsize=9, fontweight='bold')

# Connect document sections to pyramid levels
connector_style = {"color": connector_color, "linestyle": "--", "linewidth": 1, "alpha": 0.6}
plt.plot([1.4, 2], [2.5, 1.75], **connector_style)
plt.plot([1.4, 2.5], [3.5, 3.5], **connector_style)
plt.plot([1.4, 3], [4.5, 5.25], **connector_style)

# --- Add explanatory text boxes ---
explanation_text = [
    ("Each benchmark document contains sections for all three readability levels", 5, 6.5),
    ("Readers can focus on sections matching their expertise", 5, 6.2),
    ("Technical depth increases as you move up the levels", 5, 5.9)
]

for text, x, y in explanation_text:
    ax.text(x, y, text, ha='center', fontsize=11, color='#2c3e50')

# --- Add example content for each level ---
# Create text boxes with sample content
example_sections = [
    (basic_color, "☘️ File System Operations:\n• Average read time: 5ms\n• Clear performance patterns\n• Simple optimization tips", 0.2),
    (intermediate_color, "🔷 IDE State Synchronization:\n• Event propagation analysis\n• Performance variance factors\n• Implementation trade-offs", 0.2),
    (advanced_color, "⬡ Concurrency Performance:\n• Thread contention analysis\n• Lock-free algorithm comparisons\n• Memory barrier implications", 0.2)
]

for i, (color, text, alpha) in enumerate(example_sections):
    example_box = patches.FancyBboxPatch(
        (3, 0.2 + i * 0.6), 4, 0.5, boxstyle=patches.BoxStyle("Round", pad=0.3),
        facecolor=color, alpha=alpha, edgecolor=color
    )
    ax.add_patch(example_box)
    ax.text(5, 0.45 + i * 0.6, text, ha='center', va='center', fontsize=8)

# Save the figure
plt.tight_layout()
plt.savefig(os.path.join(output_dir, 'readability_levels_diagram.png'), dpi=300, bbox_inches='tight')
print(f"Readability levels diagram saved to {os.path.join(output_dir, 'readability_levels_diagram.png')}")

plt.close()
