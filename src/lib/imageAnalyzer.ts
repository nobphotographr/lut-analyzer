/**
 * Turner Blend 5方向性ブレンドレシピシステム
 * analyze_hayashi_blend_recipes.py の完全移植版
 * RGB基本分析 + 全20個LUT対応ブレンドレシピ生成
 */

// 全20個LUTのデータベース（方向性別分類 + 推奨強度範囲）
const LUT_DATABASE = {
  // ベースLUT - 主要な色調担当
  base_luts: {
    "Maverick.cube": {warmth: 0.85, contrast: 0.6, intensity: 0.8, mood: "cinematic", recommended_range: [15, 35]}, // 薄くかける系
    "F-PRO400H.cube": {warmth: 0.65, contrast: 0.7, intensity: 0.7, mood: "natural", recommended_range: [50, 80]},
    "K-Chrome.cube": {warmth: 0.45, contrast: 0.6, intensity: 0.6, mood: "clean", recommended_range: [60, 85]},
    "Anderson.cube": {warmth: 0.75, contrast: 0.8, intensity: 0.9, mood: "dramatic", recommended_range: [45, 75]},
    "Nolan.cube": {warmth: 0.2, contrast: 0.9, intensity: 0.8, mood: "cold", recommended_range: [20, 40]}, // 薄くかける系
    "Blue sierra.cube": {warmth: 0.15, contrast: 0.7, intensity: 0.6, mood: "cool", recommended_range: [40, 70]},
    "C-400D.cube": {warmth: 0.3, contrast: 0.5, intensity: 0.5, mood: "vintage", recommended_range: [55, 80]},
    "k-ektar.cube": {warmth: 0.4, contrast: 0.6, intensity: 0.6, mood: "classic", recommended_range: [50, 75]}
  },
  
  // 調整LUT - コントラスト・明度担当
  adjustment_luts: {
    "clean contrast.cube": {contrast_boost: 0.9, clarity: 0.8, strength: 0.7, recommended_range: [25, 50]},
    "highland.cube": {contrast_boost: 0.6, clarity: 0.7, strength: 0.6, recommended_range: [30, 60]},
    "Odyssey.cube": {contrast_boost: 0.7, clarity: 0.6, strength: 0.8, recommended_range: [15, 35]}, // 薄くかける系
    "Revenant.cube": {contrast_boost: 0.8, clarity: 0.9, strength: 0.7, recommended_range: [20, 40]}, // 薄くかける系
    "pastel-light.cube": {contrast_boost: 0.3, clarity: 0.4, strength: 0.4, recommended_range: [35, 65]},
    "Smorky silversalt.cube": {contrast_boost: 0.5, clarity: 0.6, strength: 0.5, recommended_range: [25, 55]}
  },
  
  // エフェクトLUT - 特殊効果担当
  effect_luts: {
    "anime pastel.cube": {creativity: 0.9, stylization: 0.8, uniqueness: 0.9, recommended_range: [15, 35]},
    "cyber neon.cube": {creativity: 0.8, stylization: 0.9, uniqueness: 0.8, recommended_range: [10, 25]},
    "Blade neon.cube": {creativity: 0.7, stylization: 0.8, uniqueness: 0.7, recommended_range: [12, 30]},
    "blue moment.cube": {creativity: 0.6, stylization: 0.6, uniqueness: 0.6, recommended_range: [20, 45]},
    "D-Anderson.cube": {creativity: 0.7, stylization: 0.7, uniqueness: 0.8, recommended_range: [15, 40]},
    "L-green.cube": {creativity: 0.4, stylization: 0.5, uniqueness: 0.5, recommended_range: [8, 25]}
  }
};

// 5方向性の定義とレシピテンプレート
const DIRECTION_TEMPLATES = {
  natural: {
    name: "🎯 ナチュラル補正",
    concept: "写真本来の美しさを引き出す",
    base_priority: ["K-Chrome.cube", "F-PRO400H.cube", "k-ektar.cube"],
    adjustment_priority: ["clean contrast.cube", "highland.cube", "Odyssey.cube"],
    effect_priority: ["L-green.cube", "blue moment.cube", "D-Anderson.cube"]
  },
  
  cinematic: {
    name: "🎬 シネマティック",
    concept: "映画的・ドラマティックな演出",
    base_priority: ["Anderson.cube", "Maverick.cube", "Nolan.cube"],
    adjustment_priority: ["clean contrast.cube", "Revenant.cube", "Odyssey.cube"],
    effect_priority: ["D-Anderson.cube", "cyber neon.cube", "Blade neon.cube"]
  },
  
  mood: {
    name: "🌅 ムード重視",
    concept: "感情や雰囲気を強調",
    base_priority: ["Maverick.cube", "F-PRO400H.cube", "Anderson.cube"],
    adjustment_priority: ["highland.cube", "pastel-light.cube", "Smorky silversalt.cube"],
    effect_priority: ["blue moment.cube", "L-green.cube", "anime pastel.cube"]
  },
  
  artistic: {
    name: "🎨 アーティスティック",
    concept: "創造的・表現重視",
    base_priority: ["F-PRO400H.cube", "Anderson.cube", "Blue sierra.cube"],
    adjustment_priority: ["pastel-light.cube", "highland.cube", "Smorky silversalt.cube"],
    effect_priority: ["anime pastel.cube", "cyber neon.cube", "Blade neon.cube"]
  },
  
  film: {
    name: "📷 フィルム風",
    concept: "アナログ・ヴィンテージ感",
    base_priority: ["C-400D.cube", "k-ektar.cube", "Blue sierra.cube"],
    adjustment_priority: ["Smorky silversalt.cube", "pastel-light.cube", "highland.cube"],
    effect_priority: ["blue moment.cube", "L-green.cube", "D-Anderson.cube"]
  }
};

export interface ImageAnalysisResult {
  rgbMeans: [number, number, number];
  warmBias: number;
  coolBias: number;
  greenPush: number;
  overallContrast: number;
  brightness: number;
  saturation: number;
  filename: string;
}

export interface MultiImageAnalysisResult {
  avgWarmBias: number;
  avgContrast: number;
  avgGreenPush: number;
  avgBrightness: number;
  avgSaturation: number;
  imageCount: number;
  individualResults: ImageAnalysisResult[];
}

export interface BlendItem {
  category: string;
  lut: string;
  strength: string;
  score: number;
}

export interface BlendRecipe {
  name: string;
  concept: string;
  blend: BlendItem[];
}

export interface BlendRecipeRecommendation {
  natural: BlendRecipe;
  cinematic: BlendRecipe;
  mood: BlendRecipe;
  artistic: BlendRecipe;
  film: BlendRecipe;
}

interface BaseLutProperties {
  warmth: number;
  contrast: number;
  intensity: number;
  mood: string;
  recommended_range: [number, number];
}

interface AdjustmentLutProperties {
  contrast_boost: number;
  clarity: number;
  strength: number;
  recommended_range: [number, number];
}

interface EffectLutProperties {
  creativity: number;
  stylization: number;
  uniqueness: number;
  recommended_range: [number, number];
}

type LutProperties = BaseLutProperties | AdjustmentLutProperties | EffectLutProperties;

// interface LutDatabase {
//   [key: string]: LutProperties;
// }

// Legacy interface for backward compatibility
export interface LUTRecommendation {
  baseLut: [string, string, string];
  adjustmentLut: [string, string, string];
  fineTuneLut: [string, string, string];
  combination: [string, string][];
}

/**
 * 画像からRGB値を抽出（Canvas API使用）
 */
function getImageRGBData(file: File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      ctx?.drawImage(img, 0, 0);
      const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
      
      if (imageData) {
        resolve(imageData);
      } else {
        reject(new Error('Failed to get image data'));
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * 標準偏差を計算（Claude Code版と同じ）
 */
function calculateStandardDeviation(values: number[]): number {
  if (values.length <= 1) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  
  return Math.sqrt(avgSquaredDiff);
}

/**
 * 単一画像のRGB分析（Claude Code版と完全同じロジック）
 */
export async function analyzeImageColors(file: File): Promise<ImageAnalysisResult | null> {
  try {
    const imageData = await getImageRGBData(file);
    const pixels = imageData.data;
    
    // RGB値の配列を作成（Claude Code版と同じ）
    const rValues: number[] = [];
    const gValues: number[] = [];
    const bValues: number[] = [];
    
    for (let i = 0; i < pixels.length; i += 4) {
      rValues.push(pixels[i] / 255.0);     // R
      gValues.push(pixels[i + 1] / 255.0); // G
      bValues.push(pixels[i + 2] / 255.0); // B
      // pixels[i + 3] はアルファ値（使用しない）
    }
    
    // 平均値計算（Claude Code版と同じ）
    const rMean = rValues.reduce((sum, val) => sum + val, 0) / rValues.length;
    const gMean = gValues.reduce((sum, val) => sum + val, 0) / gValues.length;
    const bMean = bValues.reduce((sum, val) => sum + val, 0) / bValues.length;
    
    // 色調バイアス計算（Claude Code版と完全同じ）
    const warmBias = rMean - bMean;  // 暖色バイアス（赤 - 青）
    const coolBias = bMean - rMean;  // 寒色バイアス（青 - 赤）
    const greenPush = gMean - (rMean + bMean) / 2;  // 緑の強さ
    
    // コントラスト・明度・彩度分析（Claude Code版と同じ）
    const luminance: number[] = [];
    const saturationValues: number[] = [];
    
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i] / 255.0;
      const g = pixels[i + 1] / 255.0;
      const b = pixels[i + 2] / 255.0;
      
      // 輝度計算
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      luminance.push(lum);
      
      // 彩度計算
      const maxVal = Math.max(r, g, b);
      const minVal = Math.min(r, g, b);
      const sat = maxVal > 0 ? (maxVal - minVal) / maxVal : 0;
      saturationValues.push(sat);
    }
    
    const overallContrast = calculateStandardDeviation(luminance);
    const brightness = luminance.reduce((sum, val) => sum + val, 0) / luminance.length;
    const saturation = saturationValues.reduce((sum, val) => sum + val, 0) / saturationValues.length;
    
    return {
      rgbMeans: [rMean, gMean, bMean],
      warmBias,
      coolBias,
      greenPush,
      overallContrast,
      brightness,
      saturation,
      filename: file.name
    };
    
  } catch (error) {
    console.error(`Error analyzing ${file.name}:`, error);
    return null;
  }
}

/**
 * 複数画像の分析（Claude Code版と同じロジック）
 */
export async function analyzeMultipleImages(files: File[]): Promise<MultiImageAnalysisResult | null> {
  const results: ImageAnalysisResult[] = [];
  
  for (const file of files) {
    const result = await analyzeImageColors(file);
    if (result) {
      results.push(result);
    }
  }
  
  if (results.length === 0) {
    return null;
  }
  
  // 平均値計算（Claude Code版と同じ）
  const totalWarmBias = results.reduce((sum, result) => sum + result.warmBias, 0);
  const totalContrast = results.reduce((sum, result) => sum + result.overallContrast, 0);
  const totalGreenPush = results.reduce((sum, result) => sum + result.greenPush, 0);
  const totalBrightness = results.reduce((sum, result) => sum + result.brightness, 0);
  const totalSaturation = results.reduce((sum, result) => sum + result.saturation, 0);
  
  const count = results.length;
  
  return {
    avgWarmBias: totalWarmBias / count,
    avgContrast: totalContrast / count,
    avgGreenPush: totalGreenPush / count,
    avgBrightness: totalBrightness / count,
    avgSaturation: totalSaturation / count,
    imageCount: count,
    individualResults: results
  };
}

/**
 * 写真特徴とLUT特性の親和性スコア計算
 */
function calculateLutAffinity(photoAnalysis: MultiImageAnalysisResult, lutName: string, lutProperties: LutProperties, category: string): number {
  let score = 0;
  
  if (category === "base" && 'warmth' in lutProperties) {
    // ベースLUT: 暖色・コントラスト・明度適合性
    const warmthMatch = 1 - Math.abs(photoAnalysis.avgWarmBias - (lutProperties.warmth - 0.5));
    score += warmthMatch * 0.5;
    
    const contrastMatch = 1 - Math.abs(photoAnalysis.avgContrast - lutProperties.contrast);
    score += contrastMatch * 0.3;
    
    const intensityMatch = 1 - Math.abs(photoAnalysis.avgSaturation - lutProperties.intensity);
    score += intensityMatch * 0.2;
    
  } else if (category === "adjustment" && 'contrast_boost' in lutProperties) {
    // 調整LUT: コントラストニーズとの適合性
    if (photoAnalysis.avgContrast > 0.25) {
      score += lutProperties.contrast_boost * 0.7;
    } else {
      score += (1 - lutProperties.contrast_boost) * 0.7;
    }
    
    score += lutProperties.clarity * photoAnalysis.avgSaturation * 0.3;
    
  } else if (category === "effect" && 'creativity' in lutProperties) {
    // エフェクトLUT: 創造性・ユニークネス
    const creativityPotential = photoAnalysis.avgSaturation * 0.4 + (1 - photoAnalysis.avgBrightness) * 0.3 + photoAnalysis.avgContrast * 0.3;
    score += lutProperties.creativity * creativityPotential * 0.6;
    score += lutProperties.uniqueness * 0.4;
  }
  
  return Math.max(0, Math.min(1, score));
}

/**
 * LUT個別の推奨範囲に基づく適用強度計算
 */
function calculateBlendStrength(affinityScore: number, lutProperties: LutProperties): number {
  const [minStrength, maxStrength] = lutProperties.recommended_range;
  
  // 親和性スコア（0-1）を推奨範囲内でマッピング
  // スコアが高いほど範囲内の高い値を使用
  const strength = minStrength + (affinityScore * (maxStrength - minStrength));
  
  return Math.round(strength);
}

/**
 * 5方向性のブレンドレシピ生成
 */
export function generateBlendRecipes(photoAnalysis: MultiImageAnalysisResult): BlendRecipeRecommendation {
  const recipes = {} as BlendRecipeRecommendation;
  
  for (const [directionKey, template] of Object.entries(DIRECTION_TEMPLATES)) {
    const recipe: BlendRecipe = {
      name: template.name,
      concept: template.concept,
      blend: []
    };
    
    // 各カテゴリから最適LUTを選択
    const categories = [
      { category: "base", priority: template.base_priority, database: LUT_DATABASE.base_luts },
      { category: "adjustment", priority: template.adjustment_priority, database: LUT_DATABASE.adjustment_luts },
      { category: "effect", priority: template.effect_priority, database: LUT_DATABASE.effect_luts }
    ];
    
    for (const { category, priority, database } of categories) {
      let bestLut: string | null = null;
      let bestScore = 0;
      
      // 優先順位に従ってLUTを評価
      for (const lutName of priority) {
        if (lutName in database) {
          const score = calculateLutAffinity(photoAnalysis, lutName, database[lutName as keyof typeof database], category);
          if (score > bestScore) {
            bestScore = score;
            bestLut = lutName;
          }
        }
      }
      
      // フォールバック: 優先リストになければ全体から選択
      if (!bestLut) {
        for (const [lutName, properties] of Object.entries(database)) {
          const score = calculateLutAffinity(photoAnalysis, lutName, properties, category);
          if (score > bestScore) {
            bestScore = score;
            bestLut = lutName;
          }
        }
      }
      
      // ブレンド強度計算（LUT個別の推奨範囲を使用）
      if (bestLut) {
        const lutProperties = database[bestLut as keyof typeof database];
        const strength = calculateBlendStrength(bestScore, lutProperties);
        
        recipe.blend.push({
          category,
          lut: bestLut,
          strength: `${strength}%`,
          score: bestScore
        });
      }
    }
    
    recipes[directionKey as keyof BlendRecipeRecommendation] = recipe;
  }
  
  return recipes;
}

/**
 * LUT推奨ロジック（Legacy - 後方互換性のため）
 */
export function recommendLUTs(analysis: MultiImageAnalysisResult): LUTRecommendation {
  const { avgWarmBias, avgContrast, avgGreenPush } = analysis;
  
  // ベースLUT推奨（Claude Code版と同じ閾値）
  let baseLut: [string, string, string];
  if (avgWarmBias > 0.08) {
    baseLut = ['Maverick.cube', '80-85%', '強い暖色バイアスに最適'];
  } else if (avgWarmBias > 0.04) {
    baseLut = ['F-PRO400H.cube', '75-80%', '中程度の暖色に最適'];
  } else if (avgWarmBias > 0) {
    baseLut = ['K-Chrome.cube', '70-75%', '穏やかな暖色に最適'];
  } else {
    baseLut = ['Nolan.cube', '70-75%', 'ニュートラル〜寒色に最適'];
  }
  
  // 調整LUT推奨（Claude Code版と同じ閾値）
  let adjustmentLut: [string, string, string];
  if (avgContrast > 0.15) {
    adjustmentLut = ['clean contrast.cube', '40-50%', '高コントラスト維持'];
  } else if (avgContrast > 0.10) {
    adjustmentLut = ['highland.cube', '30-40%', '中コントラスト調整'];
  } else {
    adjustmentLut = ['pastel-light.cube', '25-30%', 'ソフトな質感'];
  }
  
  // 微調整LUT推奨（Claude Code版と同じ閾値）
  let fineTuneLut: [string, string, string];
  if (avgGreenPush > 0.02) {
    fineTuneLut = ['L-green.cube', '15-25%', '緑の調整'];
  } else if (avgGreenPush < -0.02) {
    fineTuneLut = ['Smorky silversalt.cube', '15-20%', 'マゼンタ調整'];
  } else {
    fineTuneLut = ['Blue sierra.cube', '10-20%', '青の深み追加'];
  }
  
  // 具体的な組み合わせ提案（Claude Code版と同じロジック）
  let combination: [string, string][];
  if (avgWarmBias > 0.06 && avgContrast > 0.12) {
    combination = [
      ['Maverick.cube', '80%'],
      ['clean contrast.cube', '35%'],
      ['F-PRO400H.cube', '20%']
    ];
  } else if (avgWarmBias > 0.03) {
    combination = [
      ['F-PRO400H.cube', '75%'],
      ['highland.cube', '30%'],
      ['Maverick.cube', '25%']
    ];
  } else {
    combination = [
      ['K-Chrome.cube', '70%'],
      ['pastel-light.cube', '30%'],
      ['Blue sierra.cube', '15%']
    ];
  }
  
  return {
    baseLut,
    adjustmentLut,
    fineTuneLut,
    combination
  };
}