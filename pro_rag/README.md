# RAG Project with Qwen-3-0.6B

このプロジェクトは、ローカル環境で動作するRAG (Retrieval-Augmented Generation) システムです。LanceDBをベクトルデータベースとして利用し、Qwen-3-0.6Bモデルによって、与えられたドキュメントに基づいた質疑応答を行います。

## 主な特徴

*   **ローカル実行:** 全ての処理がローカルで完結するため、データプライバシーを保護できます。
*   **柔軟なデータ投入:** 様々な形式のドキュメントから知識ベースを構築できます。
*   **高速なベクトル検索:** LanceDBによる高速・効率的な類似度検索。
*   **強力な言語モデル:** Qwen-3-0.6Bモデルを活用した高品質な回答生成。
*   **CLI:** シンプルなコマンドラインインターフェースでシステムと対話可能。

## セットアップ方法

### 前提条件

*   Python 3.8 以上
*   Git

### インストール

1.  リポジトリをクローンします:
    ```bash
    git clone <リポジトリのURL>
    cd pro_rag
    ```

2.  必要なライブラリをインストールします:
    ```bash
    pip install -r requirements.txt
    ```

3.  Qwen-3-0.6Bモデルをダウンロードし、`models/qwen3-0.6B` ディレクトリに配置します。

### 使い方

1.  **ドキュメントの取り込み:**
    ```bash
    python scripts/ingest.py data/raw/ --db ~/rag_vector_store
    ```

2.  **RAG CLIの起動:**
    ```bash
    python scripts/query.py --db_path ~/rag_vector_store --model_dir models/qwen3-0.6B
    ```

## チャンキング戦略

`scripts/ingest.py` では、ドキュメントは以下の戦略でチャンクに分割されます。

*   **ツール:** `unstructured` ライブラリを使用して、様々なドキュメント形式からテキストを抽出します。
*   **チャンクサイズ:** 抽出されたテキストは、デフォルトで400文字の固定サイズチャンクに分割されます。これは、`--chunk` 引数で調整可能です。
*   **オーバーラップ:** 現在、チャンク間のオーバーラップは実装されていません。

## プロジェクト構造

```
rag_project/
├── data/                  # 元となるドキュメント
│   └── raw/
├── scripts/               # データ処理と検索のスクリプト
│   ├── ingest.py          # ドキュメントを読み込みLanceDBへ格納
│   └── query.py           # 質疑応答用CLI
├── models/                # ローカルモデル
│   └── qwen3-0.6B/
├── .gitignore
├── requirements.txt
└── README.md
```

## 主な依存ライブラリ

*   **LanceDB:** ベクトルデータベース
*   **Sentence-Transformers:** テキスト埋め込み
*   **Transformers:** Qwen-3 言語モデル
*   **Unstructured:** ドキュメント解析
