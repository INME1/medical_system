# lis_cdss/inference/background_registry.py

_model_background_map = {}

def register_background(key, df):
    _model_background_map[key] = df

def get_background_df(key):
    return _model_background_map.get(key)
