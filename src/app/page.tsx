'use client';

import { useState, useRef } from 'react';
import type { BlendRecipeRecommendation, BlendItem } from '@/lib/imageAnalyzer';

export default function Home() {
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    recipes: BlendRecipeRecommendation;
    debugData: {
      avgWarmBias: number;
      avgContrast: number;
      avgGreenPush: number;
      avgBrightness: number;
      avgSaturation: number;
      imageCount: number;
    };
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'natural' | 'cinematic' | 'mood' | 'artistic' | 'film'>('natural');
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
      // 5方向性ブレンドレシピ分析を実行
      const { analyzeMultipleImages, generateBlendRecipes } = await import('@/lib/imageAnalyzer');
      
      const analysisResult = await analyzeMultipleImages(selectedImages);
      
      if (analysisResult) {
        const recipes = generateBlendRecipes(analysisResult);
        
        setAnalysisResult({
          recipes,
          // デバッグ用に分析データも保存
          debugData: {
            avgWarmBias: analysisResult.avgWarmBias,
            avgContrast: analysisResult.avgContrast,
            avgGreenPush: analysisResult.avgGreenPush,
            avgBrightness: analysisResult.avgBrightness,
            avgSaturation: analysisResult.avgSaturation,
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
    
    const recipe = analysisResult.recipes[activeTab];
    const text = `${recipe.name}:
${recipe.blend.map((item, index) => 
      `${index + 1}. ${item.lut} - ${item.strength}`
    ).join('\n')}

💡 Sequential Cascade方式で上から順番に適用してください`;
    
    navigator.clipboard.writeText(text);
  };

  const tabConfig = [
    { key: 'natural' as const, icon: '🎯', label: 'ナチュラル' },
    { key: 'cinematic' as const, icon: '🎬', label: 'シネマティック' },
    { key: 'mood' as const, icon: '🌅', label: 'ムード' },
    { key: 'artistic' as const, icon: '🎨', label: 'アーティスティック' },
    { key: 'film' as const, icon: '📷', label: 'フィルム風' }
  ];

  return (
    <div className="min-h-screen bg-glaze-primary text-glaze-text-primary">
      {/* Header */}
      <header className="border-b border-glaze-border px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-glaze-text-primary">🎨 Turner Blend Photo Analyzer</h1>
          <p className="text-glaze-text-secondary text-sm mt-1">
            5方向性ブレンドレシピ推奨システム
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
            <h2 className="text-lg font-semibold text-glaze-text-primary">🎯 写真分析結果</h2>
            
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
                {/* Photo Analysis Summary */}
                <div className="bg-glaze-secondary/50 rounded-lg p-4">
                  <h3 className="font-semibold text-glaze-text-primary mb-3">📊 写真特徴</h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>暖色バイアス: {analysisResult.debugData.avgWarmBias.toFixed(3)}</div>
                    <div>緑プッシュ: {analysisResult.debugData.avgGreenPush.toFixed(3)}</div>
                    <div>コントラスト: {analysisResult.debugData.avgContrast.toFixed(3)}</div>
                    <div>明度: {analysisResult.debugData.avgBrightness.toFixed(3)}</div>
                    <div>彩度: {analysisResult.debugData.avgSaturation.toFixed(3)}</div>
                    <div>画像数: {analysisResult.debugData.imageCount}</div>
                  </div>
                </div>

                {/* Direction Tabs */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-glaze-text-primary">🎨 5方向性ブレンドレシピ</h3>
                  
                  {/* Tab Navigation */}
                  <div className="flex flex-wrap gap-2">
                    {tabConfig.map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          activeTab === tab.key
                            ? 'bg-glaze-accent text-white'
                            : 'bg-glaze-secondary text-glaze-text-secondary hover:bg-glaze-accent/20'
                        }`}
                      >
                        {tab.icon} {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Active Recipe Display */}
                  <div className="bg-glaze-accent/10 border border-glaze-accent/30 rounded-lg p-6">
                    <div className="mb-4">
                      <h4 className="font-semibold text-glaze-text-primary mb-2">
                        {analysisResult.recipes[activeTab].name}
                      </h4>
                      <p className="text-glaze-text-secondary text-sm">
                        {analysisResult.recipes[activeTab].concept}
                      </p>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      {analysisResult.recipes[activeTab].blend.map((item, index) => {
                        const categoryIcon = item.category === "base" ? "🎨" : item.category === "adjustment" ? "🔧" : "✨";
                        return (
                          <div key={index} className="bg-glaze-primary/50 rounded p-3">
                            <div className="font-mono text-sm">
                              {index + 1}. {categoryIcon} {item.lut} - {item.strength}
                            </div>
                            <div className="text-xs text-glaze-text-muted mt-1">
                              適合スコア: {item.score.toFixed(3)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={copyToClipboard}
                      className="w-full bg-glaze-accent hover:bg-glaze-accent-dark text-white py-2 px-4 rounded font-medium transition-colors"
                    >
                      {analysisResult.recipes[activeTab].name}をコピー
                    </button>
                  </div>
                </div>

                {/* 全方向性レシピ一覧（詳細表示） */}
                <details className="bg-glaze-secondary/50 rounded-lg p-4">
                  <summary className="text-glaze-text-muted text-sm cursor-pointer mb-2">
                    全5方向性のレシピを一覧表示
                  </summary>
                  <div className="space-y-4 mt-4">
                    {Object.entries(analysisResult.recipes).map(([key, recipe]) => (
                      <div key={key} className="border border-glaze-border rounded p-3">
                        <h5 className="font-medium text-glaze-text-primary mb-2">{recipe.name}</h5>
                        <div className="space-y-1">
                          {recipe.blend.map((item: BlendItem, index: number) => (
                            <div key={index} className="text-xs font-mono text-glaze-text-secondary">
                              {index + 1}. {item.lut} - {item.strength} (スコア: {item.score.toFixed(3)})
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-glaze-border mt-16 px-6 py-6">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-glaze-text-muted text-sm">
            💡 使い方: お好みの方向性を選択し、Sequential Cascade方式で上から順番にLUTを適用してください
          </p>
        </div>
      </footer>
    </div>
  );
}