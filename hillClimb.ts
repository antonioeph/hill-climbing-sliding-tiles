// Algorithm of hill climbing
// create two lists L,L_seen
//k is first element of L, compare with final state, if identical, stop with success
//Apply to k all available search operators, obtaining set of new states. Discard states already in L_seen. For the rest,  sort them by the evaluation function and place them at the front of L.
//Transfer k from L into L_seen
//If L is empty, stop and report failure. Otherwise, go to comparing state k with final state

//first approach

import Graph from "graphology";
import Sigma from "sigma";

const graph = new Graph({ type: 'directed', multi: true });

const N: number = 3;
let start: number = performance.now(); // to record starting execution time

let end: number = 0;
let elapsed: number = 0;

const tilesList = document.querySelectorAll('#changing-state .tile');
const waitFrame = (): Promise<void> => {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
};

const mov_board = document.getElementById('mov') as HTMLElement;
const data_run = document.getElementById('data') as HTMLElement;

const infoPanel = document.getElementById("info-panel") as HTMLElement;

const runSearch = document.getElementById("run-search") as HTMLButtonElement;

const goalPath = document.getElementById("show-goal-path") as HTMLButtonElement;

let visited_states: number = 0;
let pending_states: number = 0;

const initial_state: number[][] = [
    [0,2,1],
    [6,7,4],
    [3,8,5]
]
const final_state: number[][] = [
    [1,2,3],
    [8,0,4],
    [7,6,5]
]

let changin_state: number[] = flattenState(initial_state);

// key-string representations of start and final state
let initial_state_parent = JSON.stringify(initial_state);
let final_state_key = JSON.stringify(final_state);

interface child_info {
    parent: string | null;
    mov:string;
    distance: number;
    goal_path:boolean;
}

let states_parents: Record<string,child_info> = {
    [initial_state_parent]: {
        parent: null,
        mov: "",
        distance: 0,
        goal_path:true
    },
}

// frontier list and list of already seen states (states that generated childs or neighbours)
let L: number[][][] = [initial_state] // initially filled with only the initial state
let L_seen: number[][][] = []

// to store info about each numbered tile: a list (array) that contains [its position overall (from 0, to n-1), and the index of the row], each key corresponds to a tile number (the object inside the tile or the tile itself)
let final_positions: Record<string,number[]> = {};

// to store in order the childs at each step
let temp_ordered_states: Record<string,number[][]> = {}


// method to get representation of tiles of a board, in dictionary form: key(tile): [index of tile overall, index of row]
let get_positions = (state: number[][]): Record<string,number[]> => {
    let indexes: Record<string,number[]> = {}
    let cont: number = 0;
    state.forEach((list,index_list) => {
        list.forEach(number => {
            indexes[number]=[cont,index_list];
            cont++;
        })
    });
    return indexes;
}

// method to compare two states turning each into a JSON string
let compare_states = (state_1: number[][], state_2: number[][]): boolean => {
    // shallow comparison between objects (2d arrays)
    return JSON.stringify(get_positions(state_1)) === JSON.stringify(get_positions(state_2));
}

// method to detect a state already in L_seen, using some() to encounter the first coincidence
let seen_state = (state: number[][]): number => {
    return L_seen.some(state_seen => compare_states(state, state_seen)) ? 1 : 0;
}

//detect seen states and possible duplicates inside L
let duplicate_L = (state: number[][]): boolean => {
    return L.some(state_pending => compare_states(state,state_pending));
}

// operador: movimiento hacia arriba y hacia abajo
// 0: arriba, 1: abajo 
// return -> 1: movimiento hecho, 0: ningún movimiento realizado
let op_vertical = (state: number[][], mov: number): number => {
    let already_moved: boolean = false;
    let mov_valido: number = 0;
    
    state.forEach((list,index_list) =>{
        list.forEach((num,index_num) =>{
            if(num == 0 && already_moved == false){ // sólo si el tile está vacío o es un "espacio" y si no se ha realiza un movimiento previamente de ese espacio
                    // decisión de mov: abajo u arriba
                    // con condición de frontera superior e inferior
                    let vertical_move: number = (mov == 0 && index_list != 0) ? index_list-1 : ((mov == 1 && index_list != state.length-1) ? index_list+1 : index_list);

                    mov_valido = vertical_move !== index_list ? 1 : 0;
                    
                    //el número que se encuentra abajo/arriba de espacio (tienen el mismo index_num en su fila respectiva con indexación local)
                    let temp = state[vertical_move][index_num];
                    
                    //número temp se intercambia a espacio vacío
                    list[index_num] = list[index_num]+temp;
                    
                    //espacio vacío se mueve al lugar correspondiente
                    state[vertical_move][index_num] = 0;

                    already_moved = true;

                
            }
        });
    });
    return mov_valido;
}


// 0: izquierda, 1: derecha
let op_horizontal = (state: number[][], mov: number): number => {
    let already_moved: boolean = false;
    let mov_valido: number = 0;
    state.forEach((list,index_list) => {
        list.forEach((num,index_num) =>{
            if(num == 0 && already_moved == false){
                let mov_horizontal: number = (index_num != 0 && mov == 0) ? index_num - 1 : ((index_num != list.length -1 && mov == 1)? index_num + 1 : index_num);

                mov_valido = mov_horizontal !== index_num ? 1:0;

                // num a la izq o derecha
                let temp = list[mov_horizontal];
                
                list[mov_horizontal] = 0;
                list[index_num] = temp;
                already_moved = true;

            }
        });        
    });

    return mov_valido;
}

let register_child = (child: number[][], parent_: number [][], mov: string,d: number) =>{
    const key_child: string = JSON.stringify(child);;
    let parent_child: string | null = JSON.stringify(parent_);

    if (key_child == initial_state_parent) parent_child = null;

    if(!states_parents[key_child]){

        const newChild: child_info = {
            parent: parent_child,
            mov: mov,
            distance: d,
            goal_path:false
        };

        states_parents[key_child] = newChild;
        
    }
}

let child_states = (state: number[][]) =>{    
    let distance_child: number = 0;
    // Aplicando search operators
    L_seen.push(state);
    let state_copy: number [][] = JSON.parse(JSON.stringify(state));
    let new_child: number[][] = JSON.parse(JSON.stringify(state_copy));
    
    // left
    if (op_horizontal(new_child,0) == 1 && seen_state(new_child) == 0){
        distance_child = distance_goal(new_child);

        register_child(new_child,state_copy,"L",distance_child);
        /* console.log(new_child);
        console.log("distancia para izq:"+distance_child); */
        order(new_child,distance_child);

        
        
        /* console.log("movimiento izq:");
        console.log(new_child); */
    }
    
    

    //right
    new_child = JSON.parse(JSON.stringify(state_copy));

    if(op_horizontal(new_child,1) == 1 && seen_state(new_child) == 0){
        /* console.log("movimiento der:");
        console.log(new_child); */
        distance_child = distance_goal(new_child);
        /* console.log(new_child);
        console.log("distancia para izq:"+distance_child); */
        register_child(new_child,state_copy,"R",distance_child);

        order(new_child,distance_child);
    }
    

    //up
    new_child = JSON.parse(JSON.stringify(state_copy));
    
    if(op_vertical(new_child,0) == 1 && seen_state(new_child) == 0){
        /* console.log("movimiento arr:");
        console.log(new_child); */
        distance_child = distance_goal(new_child);
        register_child(new_child,state_copy,"U",distance_child);
        /* console.log(new_child);
        console.log("distancia para izq:"+distance_child); */
        order(new_child,distance_child);
    }
    
    
    
    //down
    new_child = JSON.parse(JSON.stringify(state_copy));
    
    if(op_vertical(new_child,1) == 1 && seen_state(new_child) == 0){
        /* console.log("movimiento ab:");
        console.log(new_child); */
        distance_child = distance_goal(new_child);
        register_child(new_child,state_copy,"D",distance_child);
        /* console.log(new_child);
        console.log("distancia para izq:"+distance_child); */
        order(new_child,distance_child);
    }
    

} 

// considerando distancia (valor absoluto)
let distance_goal = (state: number [][]): number =>{
    final_positions = get_positions(final_state);
    let current_positions: Record<string,number[]> = get_positions(state);

    let d_total: number = 0;
    let d_horizontal: number = 0;
    let d_vertical: number = 0;
    let column_sibling: number = 0;
    /* console.log(current_positions);
    console.log(final_positions); */
    

    Object.entries(current_positions).forEach( ([key,value]) => {
        if(value[1] == final_positions[`${key}`][1]){
           /*  console.log(value);
            console.log(final_positions[`${key}`]); */
            

            d_horizontal = Math.abs(final_positions[`${key}`][0] - value[0]);

          /*   console.log(`diferencia horizontal para ${key} : `+d_horizontal); */

            d_total += d_horizontal;
        }else{
            d_vertical = Math.abs(value[1] - final_positions[`${key}`][1]);

            d_total += d_vertical;

            /* console.log(`diferencia vertical para ${key} : `+ d_vertical); */
            
            if(value[1]<final_positions[`${key}`][1]){

                column_sibling = value[0]+d_vertical*N;
                
                d_horizontal = Math.abs(final_positions[`${key}`][0]-column_sibling);

               /*  console.log(`column sibling para ${key}: `+column_sibling);

                console.log(`y d_horizontal para ${key}: `+d_horizontal) */
                
                d_total+= d_horizontal;
                
                column_sibling = 0;
            }else if(value[1]>final_positions[`${key}`][1]){
                column_sibling = value[0]-d_vertical*N;
                
                d_horizontal = Math.abs(final_positions[`${key}`][0]-column_sibling);

               /*  console.log(`column sibling para ${key}: `+column_sibling);

                console.log(`y d_horizontal para ${key}: `+d_horizontal) */

                d_total+= d_horizontal;

                column_sibling = 0;



            }
 
        }
/*         console.log("distancia acumulada: "+d_total);
 */    });
    return d_total;
}

let order = (state: number[][],distance: number): void =>{
    let choose: number = 0;
    if(temp_ordered_states[distance]){
      choose = Math.random();
      
      if(choose > 0.5){
        temp_ordered_states[distance] = state; 
        }else{
            temp_ordered_states[distance] = temp_ordered_states[distance];
        }  
    }else{
        temp_ordered_states[distance] = state;
    }

     
    
}

let iteraciones = 0
let found = 0;
let child_search_key: string | null = final_state_key;
let parents_list: string[] = [];
let movs_list: string[] = [];
let num_movs_goal: number = 200;


let hillClimbing = async () =>{

    start = performance.now()

    let shouldStop = false;
    
    states_parents = {
            [initial_state_parent]: {
                parent: null,
                mov: "",
                distance:distance_goal(initial_state),
                goal_path:true
            },
        };

    while(L.length !== 0 && !shouldStop){
        
        iteraciones++;
        const newStates: number[][][] = [];

        console.log({
            iteraciones,
            frontera: L.length,
            visitados: L_seen.length
        });

        let current_state: number[][] = L.shift() as number[][]; 
        
        

        if(compare_states(current_state,final_state)){
            console.log("encontrado");
            shouldStop = true;
            console.log(current_state);
            found += 1;
            visited_states = L_seen.length;
            pending_states = L.length;
            L=[initial_state];
            L_seen=[];
            temp_ordered_states = {} as any;

            break;
        }
        if(seen_state(current_state) === 0 && !duplicate_L(current_state)){
            child_states(current_state);
        }
        

        
        // para poder recorrer el transient object se "convierte" en arreglo
        const transient_array_states  = Object.values(temp_ordered_states) as number [][][];

        //console.log(transient_array_states);

        // se recorre cada estado del objeto transient, no necesariamente el mejor (el primero) y se agrega a L (con el arreglo auxiliar newStates) si no se ha visitado (que esté en L_seen)
        for (const state of transient_array_states) {
            if (seen_state(state) === 0 && !duplicate_L(state)) {
                newStates.push(state);
            }
        }

        // se agregan los nuevos hijos con prioridad sobre los pendientes no elegidos en previas elecciones
        L = [...newStates, ...L];

        // ordenamiento de forntera global
        L.sort((a, b) => distance_goal(a) - distance_goal(b));

        //console.log(temp_ordered_states);
        //console.log(L);

        // empty transient object to avoid erratic behavior before nex iteration
        temp_ordered_states = {} as any;
        //console.log(temp_ordered_states);


    }

    /* console.log({
        iteraciones,
        frontera: L.length,
        visitados: L_seen.length
    }); */

    child_search_key = final_state_key;
    parents_list = [];
    movs_list = [];

    


    while(child_search_key!== null){
        states_parents[child_search_key].goal_path = true;
        const currentParent: any = states_parents[child_search_key];

        if (!currentParent) break; 

        parents_list.push(String(currentParent.parent));
        movs_list.push(String(currentParent.mov));
        
        child_search_key = currentParent.parent;

    }


    console.dir(movs_list.reverse(),{ maxArrayLength: null });
    console.log({numMovs:movs_list.length})
    console.dir(parents_list.reverse(),{ maxArrayLength: null });
    console.dir({numEstados: parents_list.length});

    num_movs_goal = movs_list.length;

    end = performance.now();
    elapsed = ((end - start)/1000)/60;

    
    
}

await hillClimbing();

// graph creation mapping states_parent info
// using Sigma.js

const buildGraph = async () => {
    //showChangingStates();
    graph.clear();
    const allChilds = Object.entries(states_parents);
    let nodes_goal_path: number = 0;

    for(const [key,value] of allChilds){
        // guard against the null parent of initial state
        if(value.parent){

            changin_state = flattenState(JSON.parse(value.parent));
            await showChangingStates(value.mov);


            let color_edge: string = "";

            let color_node_final: string = "";
            let color_node_initial: string = "";

            color_node_final = (key === final_state_key)? "red": "black";

            color_node_initial = (value.parent == initial_state_parent)? "red": "black";

            
            
            if(!graph.hasNode(key)){
                // child    
                graph.addNode(key,{label:key,size:value.distance,color:color_node_final,x:Math.random(),y:Math.random(),});
                
            }

            if(!graph.hasNode(value.parent)){
                //parent
                graph.addNode(value.parent,{label:value.parent, size:states_parents[value.parent as string].distance,color:color_node_initial,x:Math.random(),y:Math.random()});
            }
            
            

            color_edge = value.goal_path? "red":"#8a8686";
            nodes_goal_path = value.goal_path? nodes_goal_path=nodes_goal_path+1:nodes_goal_path;


            //connecting parent with children in that "directed" order
            graph.addEdge(value.parent,key,{size:1,label: value.mov,color:color_edge,type:"arrow",forcelabel:true});

            sigmaInstance.scheduleRefresh();

            await waitFrame();

        }
        
    }
    const finalInfo = states_parents[final_state_key];
    if (finalInfo?.parent) {
        changin_state = flattenState(JSON.parse(finalInfo.parent));
        await showChangingStates(finalInfo.mov);
    }
    runSearch.disabled= false;
    
    /* changin_state = flattenState(final_state);
    await showChangingStates(); */
    console.log(states_parents);
    console.log("Total de nodos:", graph.order);
    console.log("Total de nodos en goal path:", nodes_goal_path);
    console.log("Total de aristas:", graph.size);
}

let activeGoalPath: boolean = false;

const showGoalPath = (): void => {

    activeGoalPath=!activeGoalPath;
    
    graph.forEachEdge(edge => {

        const currColor = graph.getEdgeAttribute(edge,"color");

        if(currColor == "#8a8686") graph.setEdgeAttribute(edge,"color","#8a868600"); 
        if(currColor == "#8a868600") graph.setEdgeAttribute(edge,"color","#8a8686");
        
    })

    sigmaInstance.refresh();
}


function flattenState(state: number[][]): number[] {
    let flatState: number[] = []; 
    state.forEach(list =>{
        list.forEach(num =>{
            flatState.push(num);
        });
    });
    return flatState;
}

async function showChangingStates (mov: string) {
    let mov_: string = "";
    tilesList.forEach((num,index) =>{
        tilesList[index].textContent = String(changin_state[index]);
        tilesList[index].classList.toggle('empty',changin_state[index] == 0);
    })
    mov_ = (mov == 'U') ? 'Up: ↑': ((mov == 'D')? 'Down: ↓' :((mov == 'L')? 'Left: ←':'Right: →'));
    mov_board.innerHTML = `${mov_}`;
    await waitFrame();
}


end = performance.now();
elapsed = ((end - start)/1000)/60;
console.log(`Execution time: ${elapsed.toFixed(4)} min`);

//////////////////////////////////////////////////////////////////////
// code to configure sigma instance and some UI elements to add interaction within the graph
const container = document.getElementById("container") as HTMLElement;

let selectedNode: string | null = null;
let selectedNeighbors = new Set<string>();
const resetButton = document.getElementById("reset-camera") as HTMLButtonElement;


const sigmaInstance = new Sigma(graph,container,{
    renderEdgeLabels: true,
    labelFont: "Arial",
    labelSize: 10,
    labelWeight: "normal",

    edgeLabelFont: "Arial",
    edgeLabelSize: 9,
    edgeLabelWeight: "normal",

    labelRenderedSizeThreshold: 0,

    hideEdgesOnMove: true,
    hideLabelsOnMove: true,
    zIndex: true,

});

await buildGraph();
goalPath.disabled = false;
resetButton.disabled = false;

getRunData();




function getRunData ():void {
    data_run.innerHTML = `
        <strong>Total movements:</strong>
        <pre>${movs_list.length}</pre>
        <strong>(Real) Execution time:</strong>
        <pre>${elapsed.toFixed(4)} min</pre>
        <strong>Search space size</strong>
        <pre>${graph.order}</pre>
        <strong>Visited states:</strong>
        <pre>${visited_states}</pre>
        <strong>Pending States:</strong>
        <pre>${pending_states}</pre>
        <strong>Iterations:</strong>
        <pre>${iteraciones}</pre>
        
        `
}


sigmaInstance.on("clickNode", ({ node }) => {
    const attrs = graph.getNodeAttributes(node);

    console.log("Nodo seleccionado:");
    const info = states_parents[node];

    infoPanel.innerHTML = `
        <h3>Selected Node</h3>

        <strong>Sate (configuration):</strong>
        <pre>${node}</pre>

        <strong>Goal distance:</strong>
        <p>${info?.distance ?? "N/A"}</p>

        <strong>Parent:</strong>
        <pre>${info?.parent ?? "Sin padre"}</pre>

        <strong>Generated by movement:</strong>
        <p>${info?.mov || "N/A"}</p>

        <strong>¿Belongs to goal path?</strong>
        <p>${info?.goal_path ? "Yes" : "No"}</p>

        <p>*Movements: U(Up), D(Down), L(Left), R(Right)</p>
    `;
    console.log({
        key: node,
        label: attrs.label,
        size: attrs.size,
        color: attrs.color,
        distance: states_parents[node]?.distance,
        parent: states_parents[node]?.parent,
        mov: states_parents[node]?.mov,
        goal_path: states_parents[node]?.goal_path
    });
});



sigmaInstance.on("enterNode", () => {
    container.style.cursor = "pointer";
});

sigmaInstance.on("leaveNode", () => {
    container.style.cursor = "default";
});

sigmaInstance.on("clickNode", ({ node }) => {
    selectedNode = node;

    const attrs = graph.getNodeAttributes(node);

    sigmaInstance.getCamera().animate(
        {
            x: attrs.x,
            y: attrs.y,
            ratio: 0.2
        },
        {
            duration: 500
        }
    );

    selectedNeighbors = new Set([
        ...graph.neighbors(node),
        node
    ]);

    sigmaInstance.refresh();

    runSearch.disabled = true;
    
});

sigmaInstance.on("clickStage", () => {
    selectedNode = null;
    selectedNeighbors.clear();
    sigmaInstance.refresh();
    infoPanel.innerHTML=`
     <h3>Node Selected</h3>
        <p>Click on a node to se its info.</p>
    `;
});

resetButton.addEventListener("click", () => {
    sigmaInstance.getCamera().animate(
        {
            x: 0.5,
            y: 0.5,
            ratio: 1
        },
        {
            duration: 500
        }
    );

    
    runSearch.disabled = false;
});

runSearch.addEventListener("click", async () =>{
    data_run.innerHTML = '';
    goalPath.disabled = true;
    runSearch.disabled = true;
    resetButton.disabled = true;
    changin_state = flattenState(initial_state);
    graph.clear();
    iteraciones = 0;

    await hillClimbing();

    await buildGraph();
    goalPath.disabled = false;
    runSearch.disabled = false;
    resetButton.disabled = false;


    getRunData();

    sigmaInstance.scheduleRefresh();
    
}
)

goalPath.addEventListener("click", (e: any) =>{
   let textButton:string = "";
   showGoalPath();
   textButton = activeGoalPath ? "All Paths": "Only Goal Path"; 
   e.currentTarget.textContent = textButton;
   
})

sigmaInstance.setSetting("nodeReducer", (node, data) => {
    if (!selectedNode) return data;

    if (selectedNeighbors.has(node)) {
        return {
            ...data,
            color: node === selectedNode ? "blue" : "red",
            size: data.size * 2.5,
            forceLabel: true,
            zIndex: 20
        };
    }

    return {
        ...data,
        color: "#cccccc",
        size: Math.max(1, data.size * 0.5)
    };
});