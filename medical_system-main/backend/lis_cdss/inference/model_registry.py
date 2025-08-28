# lis_cdss/inference/model_registry.py

MODELS = {}

def load_model(key, model):
    MODELS[key] = model

def get_model(key):
    return MODELS.get(key)

def get_all_models():
    return MODELS
