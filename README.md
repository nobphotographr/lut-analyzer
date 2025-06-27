# Turner Blend Photo Analyzer

🎨 **5方向性ブレンドレシピ推奨システム**

写真分析に基づいて、Turner Blend全20個のLUTから最適なブレンドレシピを5つの美的方向性で提案するWebアプリケーションです。

## ✨ 主要機能

- **📸 写真分析**: 1-5枚の画像からRGB特性を分析
- **🎯 5方向性レシピ**: ナチュラル、シネマティック、ムード、アーティスティック、フィルム風
- **🔧 Sequential Cascade**: Photoshop互換のブレンド手順
- **📊 適合スコア**: 各LUTの写真との相性を数値化
- **📋 ワンクリックコピー**: レシピをPhotoshop用テキストで出力

## 🎨 LUT特性について

Turner Blend LUTは「薄くかける系」と「標準系」に分類され、それぞれ異なる使用方法を推奨しています。

**詳細は → [LUT特性ガイド](./LUT_CHARACTERISTICS.md)**

### 薄くかける系（高密度効果型）
- **Maverick, Nolan, Odyssey, Revenant**
- **推奨強度**: 15-40%
- **特徴**: 少量で劇的な変化

### 標準系（積み重ね型）  
- **その他16個のLUT**
- **推奨強度**: 50-85%
- **特徴**: 自然で馴染みやすい効果

## 🚀 クイックスタート

### 開発環境の起動

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) でアプリケーションが起動します。

### 使い方

1. **画像アップロード**: 1-5枚の写真をドラッグ&ドロップ
2. **分析実行**: 「分析開始」ボタンをクリック
3. **方向性選択**: 5つのタブから好みの方向性を選択
4. **レシピコピー**: Sequential Cascade用の設定をコピー
5. **Photoshop適用**: コピーした順序でLUTを適用

## 📊 分析システム

### RGB基本分析
- **暖色バイアス**: 赤と青の色調差
- **緑プッシュ**: 緑色の強さ  
- **コントラスト**: 明度の標準偏差
- **明度**: 全体的な明るさ
- **彩度**: 色の鮮やかさ

### 5方向性ブレンドレシピ
1. **🎯 ナチュラル補正**: 写真本来の美しさを引き出す
2. **🎬 シネマティック**: 映画的・ドラマティックな演出
3. **🌅 ムード重視**: 感情や雰囲気を強調
4. **🎨 アーティスティック**: 創造的・表現重視
5. **📷 フィルム風**: アナログ・ヴィンテージ感

## 🔧 技術スタック

- **Frontend**: Next.js 14 (App Router) + React 18
- **Styling**: Tailwind CSS  
- **画像処理**: Canvas API (ブラウザネイティブ)
- **TypeScript**: 完全な型安全性
- **デプロイ**: Vercel

## 📁 プロジェクト構造

```
lut-analyzer/
├── src/
│   ├── app/
│   │   └── page.tsx          # メインUI（5方向性タブ）
│   └── lib/
│       └── imageAnalyzer.ts  # 分析エンジン（全20個LUT対応）
├── requirements.md           # 詳細要件定義
├── LUT_CHARACTERISTICS.md    # LUT特性ガイド
└── README.md                # このファイル
```

## 🎯 Sequential Cascade適用順序

すべてのレシピは以下の順序で適用することを推奨：

1. **ベースLUT** → 主要な色調を決定
2. **調整LUT** → コントラスト・明度を調整
3. **エフェクトLUT** → 最終的な効果・雰囲気を追加

## 🔍 Claude Code分析エンジン

本システムは Python版 `analyze_hayashi_blend_recipes.py` と同等の分析精度を JavaScript で実現：

- **RGB統計分析**: 標準偏差・平均値計算
- **親和性スコアリング**: 写真特性とLUT特性のマッチング
- **強度最適化**: LUT個別の推奨範囲に基づく調整

## 📈 開発・デプロイ

### ビルド
```bash
npm run build
```

### Vercelデプロイ
```bash
# Vercel CLIを使用
vercel --prod
```

## 📋 要件・仕様

詳細な要件定義は [requirements.md](./requirements.md) を参照してください。

## 🤝 貢献

LUT特性やブレンドレシピに関するフィードバックは GitHub Issues でお寄せください。

---

**Turner Blend Photo Analyzer** - "ブレンドこそが価値" のコンセプトを体現する実用ツール