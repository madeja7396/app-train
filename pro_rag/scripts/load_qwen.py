from pathlib import Path
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig

def load_qwen(model_dir: str, quant: str = "4bit"):
    kwargs = {"trust_remote_code": True}
    if quant == "4bit":
        kwargs["quantization_config"] = BitsAndBytesConfig(load_in_4bit=True,
                                                           bnb_4bit_compute_dtype="bfloat16")
    tok   = AutoTokenizer.from_pretrained(model_dir, **kwargs)
    model = AutoModelForCausalLM.from_pretrained(model_dir,
                                                 device_map="auto",
                                                 torch_dtype="auto",
                                                 **kwargs)
    return tok, model

