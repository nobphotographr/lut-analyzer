'use client';

import { useState, useRef } from 'react';

export default function Home() {
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    baseLut: [string, string, string];
    adjustmentLut: [string, string, string];
    fineTuneLut: [string, string, string];
    combination: [string, string][];
    debugData: {
      avgWarmBias: number;
      avgContrast: number;
      avgGreenPush: number;
      imageCount: number;
    };
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files).filter(
      file => file.type.startsWith('image/')
    ).slice(0, 5);
    
    setSelectedImages(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, 5);
      setSelectedImages(files);
    }
  };

  const handleAnalyze = async () => {
    if (selectedImages.length === 0) return;
    
    setIsAnalyzing(true);
    
    try {
      // Claude Code版と同じRGB分析を実行
      const { analyzeMultipleImages, recommendLUTs } = await import('@/lib/imageAnalyzer');
      
      const analysisResult = await analyzeMultipleImages(selectedImages);
      
      if (analysisResult) {
        const recommendations = recommendLUTs(analysisResult);
        
        setAnalysisResult({
          baseLut: recommendations.baseLut,
          adjustmentLut: recommendations.adjustmentLut,
          fineTuneLut: recommendations.fineTuneLut,
          combination: recommendations.combination,
          // デバッグ用に分析データも保存
          debugData: {
            avgWarmBias: analysisResult.avgWarmBias,
            avgContrast: analysisResult.avgContrast,
            avgGreenPush: analysisResult.avgGreenPush,
            imageCount: analysisResult.imageCount
          }
        });
      } else {
        alert('画像の分析に失敗しました');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      alert('分析中にエラーが発生しました');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyToClipboard = () => {
    if (!analysisResult) return;
    
    const text = `🎬 あなたの写真スタイル再現版:
1. ${analysisResult.combination[0][0]} - ${analysisResult.combination[0][1]}
2. ${analysisResult.combination[1][0]} - ${analysisResult.combination[1][1]}
3. ${analysisResult.combination[2][0]} - ${analysisResult.combination[2][1]}`;
    
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-glaze-primary text-glaze-text-primary">
      {/* Header */}
      <header className="border-b border-glaze-border px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-glaze-text-primary">🎨 GLAZE Analyzer</h1>
          <p className="text-glaze-text-secondary text-sm mt-1">
            Simple LUT Recommendation Engine
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* Left Column - Image Upload */}
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-4 text-glaze-text-primary">📸 画像アップロード</h2>
              
              {/* Drag & Drop Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                  isDragOver 
                    ? 'border-glaze-accent bg-glaze-accent/10' 
                    : 'border-glaze-border hover:border-glaze-accent/60'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="text-4xl mb-4">📷</div>
                <p className="text-glaze-text-secondary mb-2">
                  画像をドラッグ&ドロップまたはクリックして選択
                </p>
                <p className="text-glaze-text-muted text-sm">
                  JPG, PNG対応 • 最大5枚まで
                </p>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Image Previews */}
            {selectedImages.length > 0 && (
              <div>
                <p className="text-sm text-glaze-text-secondary mb-3">
                  {selectedImages.length}枚の画像が選択されました
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {selectedImages.map((file, index) => (
                    <div key={index} className="aspect-square bg-glaze-secondary rounded-lg overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Analyze Button */}
            <button
              onClick={handleAnalyze}
              disabled={selectedImages.length === 0 || isAnalyzing}
              className="w-full bg-glaze-accent hover:bg-glaze-accent-dark disabled:bg-glaze-button-bg disabled:text-glaze-text-muted text-white py-3 px-6 rounded-lg font-medium transition-colors"
            >
              {isAnalyzing ? '分析中...' : '分析開始'}
            </button>
          </div>

          {/* Right Column - Analysis Results */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-glaze-text-primary">🎯 LUT分析結果</h2>
            
            {!analysisResult && !isAnalyzing && (
              <div className="bg-glaze-secondary rounded-lg p-8 text-center">
                <div className="text-4xl mb-4">🔍</div>
                <p className="text-glaze-text-secondary">
                  画像をアップロードして分析を開始してください
                </p>
              </div>
            )}

            {isAnalyzing && (
              <div className="bg-glaze-secondary rounded-lg p-8 text-center">
                <div className="text-4xl mb-4">⏳</div>
                <p className="text-glaze-text-primary">分析中...</p>
                <p className="text-glaze-text-secondary text-sm mt-2">
                  RGB値を計算しています
                </p>
              </div>
            )}

            {analysisResult && (
              <div className="space-y-6">
                {/* Final Recommendation */}
                <div className="bg-glaze-accent/10 border border-glaze-accent/30 rounded-lg p-6">
                  <h3 className="font-semibold text-glaze-text-primary mb-3">✨ 推奨組み合わせ</h3>
                  <p className="text-glaze-text-secondary mb-3">🎬 あなたの写真スタイル再現版:</p>
                  <div className="space-y-2">
                    {analysisResult.combination.map((item: string[], index: number) => (
                      <div key={index} className="bg-glaze-primary/50 rounded p-3 font-mono text-sm">
                        {index + 1}. {item[0]} - {item[1]}
                      </div>
                    ))}
                  </div>
                  
                  <button
                    onClick={copyToClipboard}
                    className="mt-4 w-full bg-glaze-accent hover:bg-glaze-accent-dark text-white py-2 px-4 rounded font-medium transition-colors"
                  >
                    設定をコピー
                  </button>
                </div>

                {/* デバッグ情報（開発時のみ表示） */}
                {analysisResult.debugData && (
                  <details className="bg-glaze-secondary/50 rounded-lg p-4">
                    <summary className="text-glaze-text-muted text-sm cursor-pointer mb-2">
                      詳細分析データを表示 (開発用)
                    </summary>
                    <div className="text-xs text-glaze-text-muted space-y-1 font-mono">
                      <div>画像数: {analysisResult.debugData.imageCount}</div>
                      <div>暖色バイアス: {analysisResult.debugData.avgWarmBias.toFixed(6)}</div>
                      <div>コントラスト: {analysisResult.debugData.avgContrast.toFixed(6)}</div>
                      <div>緑プッシュ: {analysisResult.debugData.avgGreenPush.toFixed(6)}</div>
                      <div>{`閾値判定: warmBias > 0.06 = ${analysisResult.debugData.avgWarmBias > 0.06 ? 'true' : 'false'}`}</div>
                      <div>{`閾値判定: contrast > 0.12 = ${analysisResult.debugData.avgContrast > 0.12 ? 'true' : 'false'}`}</div>
                      <div>{`閾値判定: warmBias > 0.03 = ${analysisResult.debugData.avgWarmBias > 0.03 ? 'true' : 'false'}`}</div>
                    </div>
                  </details>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-glaze-border mt-16 px-6 py-6">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-glaze-text-muted text-sm">
            💡 使い方: Photoshopで推奨されたLUTを上から順番に適用し、指定の不透明度に設定してください
          </p>
        </div>
      </footer>
    </div>
  );
}