# Hill Climbing Algorithm with Manhattan Distance Heuristic: Sliding Tiles Puzzle
Hill climbing algorithm implemented with Typescript, mainly intended with an evaluation function using heuristic of Manhattan distance for solving nxn sliding tiles puzzles.

This is a lax implementation of the Hill Climbing algorithm, for research and study purposes

* Caution advised, comments are both in English and Spanish through all the code

## Graph visualization

![Space search - Hill Climbing - Sliding tiles puzzle](/assets/img/thumbnail-graph-ui.png "Space Search Generated with Hill Climbing: Sliding Puzzle")
*Space Search Generated with Hill Climbing: Sliding Puzzle*

Space search is shown with a graph representation of all states generated and visited during the search to reach the state goal.

## Features
* Main Panel: Shows animated graph construction each run. It can be zoomed in, navigated (pan gesture) and each node can be selected to show its data and related nodes.
    * Run Button:  Triggers Hill Climbing algorithm and shows graph generation.
    * Reset Zoom Button: Self explanatory.
    * Only Goal Path Button: Toggles visualization to only goal path or all paths.
* Middle panel: Contains information about the initial state, goal state, animation of states traversed alongside graph generation, movements made and data such as total movements, (real) execution time, search space size, visited states, pending states and iterations.
* Right-most panel: It shows data about the node selected, including its configuration/state, its distance to the goal, parent, movement, and if it belongs to the path that reaches the goal.

### Dependencies
* sigma.js: ^3.0.3
* vite:^8.0.14

### Usage
* npm install
* npm run dev

### Roadmap

#### Future
- [ ] Show only goal nodes capability.
- [ ] Parity verification (solvability).
- [ ] Support for NxN arbitrary configurations.
- [ ] UI to input any NXN initial and goal configuration.
- [ ] Blog article.
- [ ] New heuristics.
- [ ] Statistical analysis.

