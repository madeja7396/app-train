# 環境
```
env_config: |
  os: windows11
  wsl:
    distro: ubuntu
    version: 24.04
  cpu: ryzen_9_8845hs
  gpu:
    model: rtx_4060_laptop
    vram_gb: 8
    driver_version: "576.52"
    cuda_version: "12.9"
  ram_gb: 32
  disk_free_gb: 500
  python: "3.11.7"
  vector_store: "lanceDB 0.24.0"
  Numpy: "1.26.4"
  PyArrow: "16.1.0"
  embedding_model: "oss" # OSSモデルを採用（例: intfloat/multilingual-e5-base など）
  llm: "qwen3-0.6B
```
