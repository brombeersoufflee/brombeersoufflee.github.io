import pandas as pd
import json

'''
This function will execute the operations on the selected dataset sequentially.
It takes in a dictionary of the dataset with the columns and rows of a dataframe. It uses these to create the pandas dataframe.
Next to that it takes in a list of operations where each operation contains the operation type, the columns it should be executed on and the value if needed.
The function will loop over the operations and execute them on the dataframe. It will store the result of the operation in a new column in the dataframe.
If the operation is a filter operation it will store the result of the filter in the dataframe.
If the operation is a store_to_table operation it will store the result of the operation in the dataframe.
The final result is than transformed back into a format that JS can use.
'''

def cast_string_to_bool(df):
    for column in df.columns:
        if set(df[column].unique()).issubset({'True', 'False'}):
            df[column] = df[column].map({'True': True, 'False': False}).astype(bool)
    return df


def execute_operations_sequentially(current_selected_dataset, operationsWithColumns):
    current_selected_dataset = json.loads(current_selected_dataset)
    operations = operationsWithColumns.to_py()
    df = pd.DataFrame(current_selected_dataset["rows"], columns=current_selected_dataset["column_names"])
    df = cast_string_to_bool(df)
    current_col = None
    for operation in operations:
        operation_type = operation['operation']
        columns = operation['columns']
        if operation_type == 'add':
            column_name = '_'.join(columns) + '_sum' if current_col is None else current_col.name + '_' + columns[
                1] + '_sum'
            current_col = df[columns[0]] + df[columns[1]] if current_col is None else current_col + df[columns[1]]
            current_col = current_col.rename(column_name)
        elif operation_type == 'subtract':
            column_name = '_'.join(columns) + '_diff' if current_col is None else current_col.name + '_' + columns[
                1] + 'diff'
            current_col = df[columns[0]] - df[columns[1]] if current_col is None else current_col - df[columns[1]]
            current_col = current_col.rename(column_name)
        elif operation_type == 'multiply':
            column_name = '_'.join(columns) + '_product' if current_col is None else current_col.name + '_' + columns[
                1] + '_product'
            current_col = df[columns[0]] * df[columns[1]] if current_col is None else current_col * df[columns[1]]
            current_col = current_col.rename(column_name)
        elif operation_type == 'divide':
            column_name = '_'.join(columns) + '_quotient' if current_col is None else current_col.name + '_' + columns[
                1] + '_quotient'
            current_col = df[columns[0]] / df[columns[1]] if current_col is None else current_col / df[columns[1]]
            current_col = current_col.rename(column_name)
        elif operation_type == 'one_hot_encode':
            temp = pd.DataFrame()
            for col in columns:
                dummies = pd.get_dummies(df[col], prefix=col)
                temp = pd.concat([temp, dummies], axis=1)
            current_col = temp
        elif operation_type == 'greater_than_column':
            col = columns[0]
            other_col = columns[1]
            result_column = f'{col if current_col is None else current_col.name}_gt_{other_col}'
            current_col = (df[col] > df[other_col] if current_col is None else current_col > df[other_col])
            current_col = current_col.rename(result_column)
        elif operation_type == 'smaller_than_column':
            col = columns[0]
            other_col = columns[1]
            result_column = f'{col if current_col is None else current_col.name}_lt_{other_col}'
            current_col = (df[col] < df[other_col] if current_col is None else current_col < df[other_col])
            current_col = current_col.rename(result_column)
        elif operation_type == 'equals_column':
            col = columns[0]
            other_col = columns[1]
            result_column = f'{col if current_col is None else current_col.name}_eq_{other_col}'
            current_col = (df[col] == df[other_col] if current_col is None else current_col == df[other_col])
            current_col = current_col.rename(result_column)
        elif operation_type in ['greater_than', 'smaller_than', 'equals', 'add_value', 'subtract_value',
                                'multiply_value', 'divide_value']:
            col = columns[0]
            value = float(operation['value'])

            if operation_type == 'greater_than':
                result_column = f'{col if current_col is None else current_col.name}_gt_{value}'
                current_col = (df[col] > value if current_col is None else current_col > value)
                current_col = current_col.rename(result_column)
            elif operation_type == 'smaller_than':
                result_column = f'{col if current_col is None else current_col.name}_lt_{value}'
                current_col = (df[col] < value if current_col is None else current_col < value)
                current_col = current_col.rename(result_column)
            elif operation_type == 'equals':
                result_column = f'{col if current_col is None else current_col.name}_eq_{value}'
                current_col = (df[col] == value if current_col is None else current_col == value)
                current_col = current_col.rename(result_column)
            elif operation_type == 'add_value':
                result_column = f'{col if current_col is None else current_col.name}_add_{value}'
                current_col = (df[col] + value if current_col is None else current_col + value)
                current_col = current_col.rename(result_column)
            elif operation_type == 'subtract_value':
                result_column = f'{col if current_col is None else current_col.name}_subtract_{value}'
                current_col = (df[col] - value if current_col is None else current_col - value)
                current_col = current_col.rename(result_column)
            elif operation_type == 'multiply_value':
                result_column = f'{col if current_col is None else current_col.name}_multiply_{value}'
                current_col = (df[col] * value if current_col is None else current_col * value)
                current_col = current_col.rename(result_column)
            elif operation_type == 'divide_value':
                result_column = f'{col if current_col is None else current_col.name}_divide_{value}'
                current_col = (df[col] / value if current_col is None else current_col / value)
                current_col = current_col.rename(result_column)
        elif operation_type == 'equal_word':
            value = operation['value']
            col = columns[0]
            result_column = f'{col if current_col is None else current_col.name}_eq_{value}'
            current_col = (df[col] == value if current_col is None else current_col == value)
            current_col = current_col.rename(result_column)
        else:
            for col in columns:
                if operation_type == 'mean':
                    current_col = pd.DataFrame(
                        {'gemiddelde': [df[col].mean() if current_col is None else current_col.mean()]})
                elif operation_type == 'median':
                    current_col = pd.DataFrame(
                        {'mediaan': [df[col].median() if current_col is None else current_col.median()]})
                elif operation_type == 'std':
                    current_col = pd.DataFrame(
                        {'standaarddeviatie': [df[col].std() if current_col is None else current_col.std()]})
                elif operation_type == 'square':
                    result_column = f'{col}_squared' if current_col is None else current_col.name + '_squared'
                    current_col = df[col] ** 2 if current_col is None else current_col ** 2
                    current_col = current_col.rename(result_column)
                elif operation_type == 'store_to_table':
                    df = pd.concat([df, current_col], axis=1)
                elif operation_type == 'max':
                    current_col = pd.DataFrame(
                        {'Max': [df[col].max() if current_col is None else current_col.max()]})
                elif operation_type == 'min':
                    current_col = pd.DataFrame(
                        {'Min': [df[col].min() if current_col is None else current_col.min()]})
                elif operation_type == 'sum':
                    current_col = pd.DataFrame(
                        {'Som': [df[col].sum() if current_col is None else current_col.sum()]})
                elif operation_type == 'count':
                    current_col = pd.DataFrame(
                        {'Aantal': [df[col].count() if current_col is None else current_col.count()]})
                elif operation_type == 'apply_filter':
                    current_col = df[current_col]
                    df = current_col

    modified_df = {
        "columns": df.columns.tolist(),
        "rows": df.to_dict(orient="records")
    }

    if isinstance(current_col, pd.Series):
        current_col = current_col.to_frame()

    result_df = {
        "columns": current_col.columns.tolist(),
        "rows": current_col.to_dict(orient="records")
    }
    return {"modified_df": modified_df, "results": result_df}
