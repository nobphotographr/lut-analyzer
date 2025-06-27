# Turner Blend LUT Files

## 📁 ディレクトリ構造

```
public/luts/
├── base/          # ベースLUT - 主要な色調担当
├── adjustment/    # 調整LUT - コントラスト・明度担当
└── effect/        # エフェクトLUT - 特殊効果担当
```

## 📋 LUT配置方法

### **ベースLUT** (`/base/`)
以下のLUTファイルを配置してください：
- Maverick.cube
- F-PRO400H.cube
- K-Chrome.cube
- Anderson.cube
- Nolan.cube
- Blue_sierra.cube
- C-400D.cube
- k-ektar.cube

### **調整LUT** (`/adjustment/`)
以下のLUTファイルを配置してください：
- clean_contrast.cube
- highland.cube
- Odyssey.cube
- Revenant.cube
- pastel-light.cube
- Smorky_silversalt.cube

### **エフェクトLUT** (`/effect/`)
以下のLUTファイルを配置してください：
- anime_pastel.cube
- cyber_neon.cube
- Blade_neon.cube
- blue_moment.cube
- D-Anderson.cube
- L-green.cube

## 🔗 システム連携

### **現在の機能**
- LUT推奨・ブレンドレシピ生成
- Sequential Cascade適用順序の提案
- 適合スコアの算出

### **将来的な拡張（.cubeファイル活用）**
- ブラウザ内でのリアルタイムプレビュー
- LUT効果のビフォー・アフター表示
- カスタムLUTのアップロード機能

## 📝 ファイル命名規則

- **スペース** → **アンダースコア** (`Blue sierra` → `Blue_sierra`)
- **小文字統一**: ファイル名は小文字推奨
- **拡張子**: `.cube` 形式のみ対応

## 🚀 アクセス方法

配置されたLUTファイルは以下のURLでアクセス可能：
```
http://localhost:3000/luts/base/Maverick.cube
http://localhost:3000/luts/adjustment/clean_contrast.cube
http://localhost:3000/luts/effect/anime_pastel.cube
```

## ⚠️ 注意事項

- LUTファイルは著作権保護されている場合があります
- 商用利用の際は適切なライセンス確認を行ってください
- ファイルサイズが大きい場合はユーザー体験に影響する可能性があります

---

**Turner Blend Photo Analyzer** - LUT管理ガイド