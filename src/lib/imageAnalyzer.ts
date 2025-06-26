/**
 * Claude Code版と同じRGB分析ロジックをJavaScriptに移植
 * analyze_hayashi_simple.py の完全移植版
 */

export interface ImageAnalysisResult {
  rgbMeans: [number, number, number];
  warmBias: number;
  coolBias: number;
  greenPush: number;
  overallContrast: number;
  filename: string;
}

export interface MultiImageAnalysisResult {
  avgWarmBias: number;
  avgContrast: number;
  avgGreenPush: number;
  imageCount: number;
  individualResults: ImageAnalysisResult[];
}

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
    
    // コントラスト分析（標準偏差）- Claude Code版と同じ
    let rStd: number, gStd: number, bStd: number;
    try {
      rStd = calculateStandardDeviation(rValues);
      gStd = calculateStandardDeviation(gValues);
      bStd = calculateStandardDeviation(bValues);
    } catch {
      rStd = gStd = bStd = 0;
    }
    
    const overallContrast = (rStd + gStd + bStd) / 3;
    
    return {
      rgbMeans: [rMean, gMean, bMean],
      warmBias,
      coolBias,
      greenPush,
      overallContrast,
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
  
  const count = results.length;
  
  return {
    avgWarmBias: totalWarmBias / count,
    avgContrast: totalContrast / count,
    avgGreenPush: totalGreenPush / count,
    imageCount: count,
    individualResults: results
  };
}

/**
 * LUT推奨ロジック（Claude Code版と完全同じ閾値とロジック）
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