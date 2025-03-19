```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#f5f5f5', 'primaryTextColor': '#333', 'primaryBorderColor': '#ccc', 'lineColor': '#555', 'secondaryColor': '#f0f0f0', 'tertiaryColor': '#fff' }}}%%
xychart-beta
    title "Response Time vs Task Complexity"
    x-axis "Task Complexity (Component Interdependencies)" [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    y-axis "Response Time (seconds)" [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    
    line [0.5, 0.8, 1.2, 1.5, 2.0, 2.6, 3.1, 3.8, 4.5, 5.2]
        label "Unified Architecture"
        point-style "circle"
        line-style "solid"
        y-axis-stagger true
        color "blue"
    
    line [0.6, 1.2, 1.9, 3.0, 4.2, 5.5, 6.8, 8.0, 9.3, 10.5]
        label "Hierarchical Architecture"
        point-style "triangle"
        line-style "solid"
        y-axis-stagger true
        color "purple"

    annotations
        annotation "Unified scales linearly" (6, 3) "blue"
        annotation "Hierarchical scales exponentially" (7, 7) "purple"
``` 