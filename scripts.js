var range = function (start, stop, step) {
    step = step || 1;
    var arr = [];
    for (var i = start; i < stop; i += step) {
        arr.push(i);
    }
    return arr;
};

function onlyUnique(value, index, array) {
    return array.indexOf(value) === index;
}

function getOccurrence(array, value) {
    return array.filter((v) => (v === value)).length;
}

function getOccurrenceList(array, list) {
    return list.map((v) => getOccurrence(array, v));
}

document.getElementById('plot-btn').addEventListener('click', async function () {
    let plotDiv = document.getElementById('plotly-position');
    var xColumn = [document.getElementById('x-axis-select').value];
    var yColumns = Array.from(document.querySelectorAll('#columns input:checked')).map(cb => cb.value);
    var plotType = document.getElementById('plot-type-select').value;
    if (current_df != null) {
        let data = current_df;
        let x = null;
        let y = yColumns.map(col => data.loc(null, [col]).values.flat(1));
        if (xColumn[0] === "") {
            let length = data.shape[0];
            x = range(0, length, 1);
            x = x.flat(1);
        } else {
            x = xColumn.map(col => data.loc(null, [col]).values.flat(1))[0];
        }
        var traces = [];
        y.forEach(function (item, index) {
            let trace = null;
            if (plotType === 'lines') {
                trace = {
                    x: x,
                    y: item,
                    type: plotType,
                    name: yColumns[index]
                }
            } else if (plotType === 'scatter') {
                trace = {
                    x: x,
                    y: item,
                    mode: 'markers',
                    type: plotType,
                    name: yColumns[index]
                }
            } else if (plotType === 'bar') {
                trace = {
                    x: x,
                    y: item,
                    type: plotType,
                    name: yColumns[index]
                }
            } else if (plotType === 'histogram') {
                trace = {
                    x: item,
                    type: plotType,
                    name: yColumns[index]
                }
            } else if (plotType === 'box') {
                trace = {
                    y: item,
                    type: plotType,
                    name: yColumns[index]
                }
            } else if (plotType === 'pie') {
                trace = {
                    values: getOccurrenceList(item, item.filter(onlyUnique)),
                    labels: item.filter(onlyUnique).map(string => yColumns[index] + " " + string),
                    type: plotType,
                    name: yColumns[index]
                }
            }
            traces.push(trace);
        });

        Plotly.newPlot(plotDiv, traces, {
            margin: {t: 0}
        });
    }
});

document.getElementById('clear-btn').addEventListener('click', function () {
    document.getElementById('plotly-position').innerHTML = '';
});

document.addEventListener('DOMContentLoaded', async function () {
    let data_response = await fetch('data/datasets.json');
    let listDatasets = await data_response.json();

    const datasetSelect = document.getElementById('dataset-select');
    datasetSelect.innerHTML = '<option value="">-- Kies een Dataset --</option>';

    if (listDatasets.length > 0) {
        listDatasets.forEach(function (dataset) {
            const option = document.createElement('option');
            option.value = dataset;
            option.textContent = dataset;
            datasetSelect.appendChild(option);
        });
    } else {
        console.error('No datasets found');
    }
});

let current_selected_dataset_path = null;
let current_df = null;

function clear_operations_tab() {
    operationsQueue = [];
    updateOperationsQueueDisplay();
    document.getElementById('table-head_results').innerHTML = '';
    document.getElementById('table-body_results').innerHTML = '';
}

document.getElementById('dataset-select').addEventListener('change', async function () {
    clear_operations_tab();

    var selectedDataset = this.value;
    current_selected_dataset_path = 'data/' + selectedDataset;
    if (selectedDataset) {
        let csvData = await fetch('data/' + selectedDataset)
        csvData = await csvData.text();

        const parsedData = Papa.parse(csvData, {
            columns: true, // Treat the first row as header
            skip_empty_lines: true,
            dynamicTyping: true,
            header: true
        });
        current_df = new jandas.DataFrame(parsedData.data);

        let column_labels = current_df.columns.to_raw().values;

        // updateColumnsDropdown(response)
        var xAxisSelect = document.getElementById('x-axis-select');
        var columnsDiv = document.getElementById('columns');

        xAxisSelect.innerHTML = '<option value="">Kies X-as Kolom (Optioneel)</option>';
        columnsDiv.innerHTML = '';

        column_labels.forEach(function (col) {
            var option = document.createElement('option');
            option.value = col;
            option.textContent = col;
            xAxisSelect.appendChild(option);

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = col;
            checkbox.value = col;
            checkbox.className = 'checkbox-button';
            columnsDiv.appendChild(checkbox);

            const label = document.createElement('label');
            label.htmlFor = col;
            label.className = 'checkbox-label';
            label.textContent = col;
            columnsDiv.appendChild(label);

            columnsDiv.appendChild(document.createElement('br'));
        });
    }

    refreshDataView();
});

function updateColumnsDropdown(columns) {
    const columnsDiv = document.getElementById('columns');
    const xAxisSelect = document.getElementById('x-axis-select');
    columnsDiv.innerHTML = '';
    xAxisSelect.innerHTML = '<option value="">Select X-axis Column (Optional)</option>';

    columns.forEach(column => {
        const option = document.createElement('option');
        option.value = column;
        option.textContent = column;
        xAxisSelect.appendChild(option);

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = column;
        checkbox.value = column;
        checkbox.className = 'checkbox-button';

        columnsDiv.appendChild(checkbox);
        const label = document.createElement('label');
        label.htmlFor = column;
        label.className = 'checkbox-label';
        label.textContent = column;

        columnsDiv.appendChild(label);

        columnsDiv.appendChild(document.createElement('br'));
    });

    // Update any existing operations with new dropdowns
    // updateOperationsQueueDisplay();
}

document.getElementById('data-view-tab').addEventListener('click', function () {
    refreshDataView();
});

function refreshDataView() {
    if (current_df != null) {
        try {
            let data = current_df;
            var tableHead = document.getElementById('table-head');
            var tableBody = document.getElementById('table-body');
            tableHead.innerHTML = ''; // Clear existing content
            tableBody.innerHTML = '';
            let columns = data.columns.to_raw().values;
            // Add table headers
            columns.forEach(function (column) {
                var th = document.createElement('th');
                th.textContent = column;
                tableHead.appendChild(th);
            });

            let rows = data.values;
            rows.forEach(function (row) {
                var tr = document.createElement('tr');
                columns.forEach(function (column) {
                    var td = document.createElement('td');
                    td.textContent = row[columns.indexOf(column)];
                    tr.appendChild(td);
                });
                tableBody.appendChild(tr);
            })
            ;
            var surroundingDiv = document.getElementById('data-view')
        } catch (error) {
            console.error('Error:', error.message);
            alert('An error occurred: ' + error.message);
        }
    }

}

const operation_lookup_table = {
    'mean': 'Gemiddelde',
    'median': 'Mediaan',
    'std': 'Standaarddeviatie',
    'square': 'Kwadraat',
    'add': 'Kolommen Optellen',
    'subtract': 'Kolommen Aftrekken',
    'multiply': 'Kolommen Vermenigvuldigen',
    'divide': 'Kolommen Delen',
    'greater_than': 'Groter dan Waarde',
    'smaller_than': 'Kleiner dan Waarde',
    'equals': 'Gelijk aan Waarde',
    'greater_than_column': 'Groter dan Kolom',
    'smaller_than_column': 'Kleiner dan Kolom',
    'equals_column': 'Gelijk aan Kolom',
    'one_hot_encode': 'One-Hot Codering',
    'store_to_table': 'Opslaan in Tabel',
    'max': 'Max',
    'min': 'Min',
    'sum': 'Som',
    'add_value': 'Getal Optellen',
    'subtract_value': 'Getal Aftrekken',
    'multiply_value': 'Getal Vermenigvuldigen',
    'divide_value': 'Getal Delen',
    'apply_filter': 'Filter Toepassen',
    'count': 'Aantal',
    'equal_word': 'Gelijk aan Woord',
}

let operationsQueue = [];
let current_operations_id = 0;

function addOperation(operation) {
    if (current_df == null) {
        alert('Selecteer eerst een dataset.');
        return;
    }

    if (operation === 'apply_filter') {
        if (operationsQueue.length === 0) {
            return alert('Deze operatie volgt alleen naar een vergelijkingsoperatie.');
        }
        let previous_operation = operationsQueue[operationsQueue.length - 1].operation
        if (!['greater_than', 'smaller_than', 'equals', 'greater_than_column', 'smaller_than_column', 'equals_column', 'equal_word'].includes(previous_operation)) {
            return alert('Deze operatie volgt alleen naar een vergelijkingsoperatie.');
        }
    }

    if (operationsQueue.length > 0) {
        if (['mean', 'median', 'std', 'square', 'one_hot_encode', 'store_to_table', 'max', 'min', 'sum', 'apply_filter', 'count'].includes(operationsQueue[operationsQueue.length - 1]['operation'])) {
            return alert('Je kunt geen operatie toevoegen na de vorige operatie.');
        }
    }

    const operationId = current_operations_id;
    current_operations_id += 1;
    operationsQueue.push({operation, operationId, select1: "", select2: "", inputValue: 0});
    updateOperationsQueueDisplay();
    execute_sequentially();
}

function execute_sequentially() {
    if (operationsQueue.length === 0) {
        document.getElementById('table-head_results').innerHTML = '';
        document.getElementById('table-body_results').innerHTML = '';
        updateColumnsDropdown(current_df.columns.to_raw().values);
        updateOperationsQueueDisplay();
        return;
    }

    // Collect the selected columns for each operation
    try {
        const operationsWithColumns = operationsQueue.map(op => {
            const selectElement1 = document.querySelector(`select[data-operation-id="${op.operationId}"][data-column="col1"]`);
            const selectElement2 = document.querySelector(`select[data-operation-id="${op.operationId}"][data-column="col2"]`);
            const inputValue = document.querySelector(`input[data-operation-id="${op.operationId}"][data-column="value"]`);
            const selectedColumns = [selectElement1.value];
            operationsQueue[operationsQueue.findIndex(x => x.operationId === op.operationId)].select1 = selectElement1.value;
            if (selectElement2 !== null) {
                operationsQueue[operationsQueue.findIndex(x => x.operationId === op.operationId)].select2 = selectElement2.value;
            }
            if (inputValue !== null) {
                operationsQueue[operationsQueue.findIndex(x => x.operationId === op.operationId)].inputValue = inputValue.value;
            }
            if (selectElement2) {
                selectedColumns.push(selectElement2.value);
            }

            let sentValue = 0;
            if (inputValue) {
                sentValue = inputValue.value;
            }
            return {operation: op.operation, columns: selectedColumns, value: sentValue};
        });
        df_py = {
            column_names: current_df.columns.to_raw().values,
            rows: current_df.values
        };
        df_py = JSON.stringify(df_py);
        let results = execute_operations_sequentially(df_py, operationsWithColumns).toJs();

        let modified_df_rows = [];

        results.get('modified_df').get('rows').forEach(row => {
            modified_df_rows.push(Array.from(row, ([name, value]) => (value)));
        });

        current_df = new jandas.DataFrame(modified_df_rows, {columns: results.get('modified_df').get('columns')});
        refreshDataView();

        let result_df_rows = [];
        results.get('results').get('rows').forEach(result => {
            result_df_rows.push(Array.from(result, ([name, value]) => (value)));
        });

        let result_df = new jandas.DataFrame(result_df_rows, {columns: results.get('results').get('columns')});

        var tableHead = document.getElementById('table-head_results');
        var tableBody = document.getElementById('table-body_results');
        tableHead.innerHTML = ''; // Clear existing content
        tableBody.innerHTML = '';
        let columns = result_df.columns.to_raw().values;
        // Add table headers
        columns.forEach(function (column) {
            var th = document.createElement('th');
            th.textContent = column;
            tableHead.appendChild(th);
        });

        let rows = result_df.values;
        rows.forEach(function (row) {
            var tr = document.createElement('tr');
            columns.forEach(function (column) {
                var td = document.createElement('td');
                td.textContent = row[columns.indexOf(column)];
                tr.appendChild(td);
            });
            tableBody.appendChild(tr);
        });

        updateColumnsDropdown(current_df.columns.to_raw().values);
        updateOperationsQueueDisplay();
    } catch (e) {
        operationsQueue = [];
        updateOperationsQueueDisplay();
        console.error(e);
    }
}

function createColumnsDropdown(operationId, operation) {
    const columnsDiv = document.getElementById('columns');
    const columns = Array.from(columnsDiv.querySelectorAll('input[type="checkbox"]')).map(cb => cb.value);

    const select1 = document.createElement('select');
    select1.addEventListener('change', function () {
        execute_sequentially();
    });

    select1.className = 'form-control form-control-sm';
    select1.setAttribute('data-operation-id', operationId);
    select1.setAttribute('data-column', 'col1');
    columns.forEach(column => {

        const option = document.createElement('option');
        option.value = column;
        option.textContent = column;
        select1.appendChild(option);
    });
    if (operationsQueue.length > 0 && operationId !== operationsQueue[0].operationId) {
        select1.disabled = true;
        select1.style.opacity = 0.5;
    }
    if (operationsQueue[operationsQueue.findIndex(x => x.operationId === operationId)].select1 !== "") {
        select1.value = operationsQueue[operationsQueue.findIndex(x => x.operationId === operationId)].select1;
    }

    let container = document.createElement('div');
    container.className = 'd-flex align-items-center';
    container.appendChild(select1);

    // Create a second dropdown or an input box for the comparison value
    if (['add', 'subtract', 'multiply', 'divide', 'greater_than', 'smaller_than', 'equals', 'greater_than_column', 'smaller_than_column', 'equals_column', 'add_value', 'subtract_value', 'multiply_value', 'divide_value', 'equal_word'].includes(operation)) {
        if (operation === 'greater_than' || operation === 'smaller_than' || operation === 'equals' || operation === 'add_value' || operation === 'subtract_value' || operation === 'multiply_value' || operation === 'divide_value') {
            const inputValue = document.createElement('input');
            inputValue.className = 'form-control form-control-sm ml-2';
            inputValue.setAttribute('type', 'number');
            inputValue.setAttribute('data-operation-id', operationId);
            inputValue.setAttribute('data-column', 'value');
            inputValue.setAttribute('value', '0');
            inputValue.addEventListener('change', function () {
                execute_sequentially();
            });
            inputValue.value = operationsQueue[operationsQueue.findIndex(x => x.operationId === operationId)].inputValue;
            container.appendChild(inputValue);
        } else if (operation === 'equal_word') {
            const inputValue = document.createElement('input');
            inputValue.className = 'form-control form-control-sm ml-2';
            inputValue.setAttribute('type', 'text');
            inputValue.setAttribute('data-operation-id', operationId);
            inputValue.setAttribute('data-column', 'value');
            inputValue.setAttribute('value', '');
            inputValue.addEventListener('change', function () {
                execute_sequentially();
            });
            inputValue.value = operationsQueue[operationsQueue.findIndex(x => x.operationId === operationId)].inputValue;
            container.appendChild(inputValue);

        } else {
            const select2 = document.createElement('select');
            select2.className = 'form-control form-control-sm ml-2';
            select2.setAttribute('data-operation-id', operationId);
            select2.setAttribute('data-column', 'col2');
            columns.forEach(column => {
                const option = document.createElement('option');
                option.value = column;
                option.textContent = column;
                select2.appendChild(option);
            });
            select2.addEventListener('change', function () {
                execute_sequentially();
            });
            if (operationsQueue[operationsQueue.findIndex(x => x.operationId === operationId)].select2 !== "") {
                select2.value = operationsQueue[operationsQueue.findIndex(x => x.operationId === operationId)].select2;
            }
            container.appendChild(select2);
        }
    }

    return container;
}

function check_filter_removal() {
    if (operationsQueue.length === 0) {
        return;
    }
    if (operationsQueue[operationsQueue.length - 1].operation === 'apply_filter' && operationsQueue.length > 1 && ['greater_than', 'smaller_than', 'equals', 'greater_than_column', 'smaller_than_column', 'equals_column'].includes(operationsQueue[operationsQueue.length - 2].operation)) {
        return;
    } else {
        operationsQueue.pop();
    }
}

function removeOperation(operationId) {
    check_filter_removal();
    operationsQueue = operationsQueue.filter(op => op.operationId !== operationId);
    updateOperationsQueueDisplay();
    execute_sequentially();
}

function updateOperationsQueueDisplay() {
    const operationsQueueElement = document.getElementById('operations-queue');
    operationsQueueElement.innerHTML = '';
    operationsQueue.forEach((operationObj, index) => {
        const listItem = document.createElement('li');
        listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
        listItem.innerHTML = `${operation_lookup_table[operationObj.operation]}`;

        const div = document.createElement("div");

        const button = document.createElement("button")
        button.className = "btn btn-danger btn-sm ml-2";
        button.onclick = _ => removeOperation(operationObj.operationId);
        button.innerHTML = "Verwijder";
        div.replaceChildren(createColumnsDropdown(operationObj.operationId, operationObj.operation), button);
        listItem.appendChild(div);
        operationsQueueElement.appendChild(listItem);
    });
}


let execute_operations_sequentially = null;

async function initialize_pyodide() {
    console.log("initializing pyodide")
    pyodide = await loadPyodide();
    await pyodide.loadPackage(['pandas']);
    let pythonCode_execute_operations = await fetch('python_scripts/execute_operations.py');
    pythonCode_execute_operations = await pythonCode_execute_operations.text();
    pyodide.runPython(pythonCode_execute_operations);
    execute_operations_sequentially = pyodide.globals.get('execute_operations_sequentially');
    console.log("pyodide initialized")
    document.getElementById('loading').remove();
}

initialize_pyodide();