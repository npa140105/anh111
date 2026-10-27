import React, { useState } from 'react';
import { DETAILED_RECIPES, DetailedRecipe } from '../../data/recipesData';
import { useShop } from '../../context/ShopContext';
import { BookOpen, Clock, Sparkles, ChefHat, Check, ShoppingBag, ArrowRight } from 'lucide-react';
import { playTapSound, playSelectSound } from '../../utils/audio';

export const RecipeGuideSection: React.FC<{ onNavigateToPOS: () => void }> = ({ onNavigateToPOS }) => {
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(DETAILED_RECIPES[0].id);
  const { addToCart, drinks, toppings } = useShop();
  const [addedToast, setAddedToast] = useState<string | null>(null);

  const activeRecipe = DETAILED_RECIPES.find((r) => r.id === selectedRecipeId) || DETAILED_RECIPES[0];

  const handleOrderRecipe = (recipe: DetailedRecipe) => {
    playSelectSound();
    // Match standard drink if available
    const standardDrink = drinks.find(
      (d) => d.name.includes(recipe.name.substring(0, 4)) || recipe.name.includes(d.name.substring(0, 4))
    );

    if (standardDrink) {
      addToCart({
        id: `cart_${Date.now()}`,
        drinkId: standardDrink.id,
        drinkName: standardDrink.name,
        size: 'L',
        ice: '少冰',
        sugar: '微糖(3分)',
        toppings: [toppings[0]], // boba
        unitPrice: standardDrink.priceL + 10,
        quantity: 1,
        subtotal: standardDrink.priceL + 10,
        notes: `依經典職人食譜【${recipe.name}】製作`,
        ecoCup: false,
      });
    } else {
      addToCart({
        id: `cart_${Date.now()}`,
        drinkId: 'custom_specialty',
        drinkName: `✨ ${recipe.name}`,
        size: 'L',
        ice: '少冰',
        sugar: '半糖(5分)',
        toppings: [toppings[0]],
        unitPrice: 85,
        quantity: 1,
        subtotal: 85,
        notes: `依經典職人食譜【${recipe.name}】製作`,
        ecoCup: false,
      });
    }

    setAddedToast(recipe.name);
    setTimeout(() => setAddedToast(null), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-amber-700" />
            <span>經典調飲食譜與職人製作指南 (Brewing SOP Lab)</span>
          </h1>
          <p className="text-sm text-stone-500 mt-1 max-w-2xl">
            提供台灣手搖飲殿堂級經典配方，詳列原料克數比例、精確秒數溫度步驟、延伸風味變化與主廚秘訣。
          </p>
        </div>
        <button
          onClick={onNavigateToPOS}
          className="self-start md:self-auto px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <span>前往前台 POS 銷售出杯</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Recipe Picker Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {DETAILED_RECIPES.map((recipe) => {
          const isSelected = recipe.id === selectedRecipeId;
          return (
            <button
              key={recipe.id}
              onClick={() => {
                setSelectedRecipeId(recipe.id);
                playTapSound();
              }}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'border-amber-900 bg-amber-50/50 shadow-sm ring-1 ring-amber-900'
                  : 'border-stone-200 bg-white hover:border-stone-300'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] text-stone-400 mb-1">
                <span>{recipe.category}</span>
                <span className="font-medium text-stone-600">{recipe.difficulty}</span>
              </div>
              <h3 className="font-bold text-sm text-stone-900 truncate">{recipe.name}</h3>
              <p className="text-[11px] text-stone-500 truncate mt-0.5">{recipe.enName}</p>
              <div className="mt-3 flex items-center gap-1 text-[11px] text-stone-400">
                <Clock className="w-3 h-3" />
                <span>{recipe.prepTime.split('(')[0]}</span>
              </div>
            </button>
          );
        })}
      </div>

      {addedToast && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>已將「{addedToast}」加入前台購物車！</span>
          </div>
          <button
            onClick={onNavigateToPOS}
            className="font-bold text-emerald-900 underline hover:no-underline cursor-pointer"
          >
            立即結帳 →
          </button>
        </div>
      )}

      {/* Selected Recipe Deep Dive */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-10 shadow-xs space-y-10">
        {/* Top Info Banner */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-8 border-b border-stone-200 gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs text-stone-500">
              <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 font-semibold rounded-md">
                {activeRecipe.category}
              </span>
              <span>·</span>
              <span>難易度：{activeRecipe.difficulty}</span>
              <span>·</span>
              <span>製作耗時：{activeRecipe.prepTime}</span>
              <span>·</span>
              <span>份量：{activeRecipe.servingSize}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              {activeRecipe.name}
            </h2>
            <p className="text-sm text-stone-600 leading-relaxed">{activeRecipe.description}</p>
            <div className="text-xs text-stone-500 pt-1 italic">{activeRecipe.story}</div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={() => handleOrderRecipe(activeRecipe)}
              className="px-6 py-3 bg-amber-900 hover:bg-amber-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>以本配方加入 POS 銷售出單</span>
            </button>
          </div>
        </div>

        {/* Section 1: Ingredients Formula Table */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-amber-800" />
            <h3 className="text-lg font-bold text-stone-900">
              01. 嚴選原物料黃金配比清單 (Ingredients & Ratios)
            </h3>
          </div>

          <div className="overflow-x-auto rounded-xl border border-stone-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">原料名稱</th>
                  <th className="py-3 px-4 font-semibold">用量配比</th>
                  <th className="py-3 px-4 font-semibold">性質類別</th>
                  <th className="py-3 px-4 font-semibold">調配重點說明</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {activeRecipe.ingredients.map((ing, idx) => (
                  <tr key={idx} className="hover:bg-stone-50/50">
                    <td className="py-3 px-4 font-semibold text-stone-900">{ing.name}</td>
                    <td className="py-3 px-4 font-mono font-bold text-amber-900 tabular-nums">
                      {ing.amount}
                    </td>
                    <td className="py-3 px-4 text-stone-500">
                      {ing.type === 'tea' && '原茶茶湯'}
                      {ing.type === 'dairy' && '鮮乳/乳品'}
                      {ing.type === 'sweetener' && '天然糖漿'}
                      {ing.type === 'topping' && '嚼感配料'}
                      {ing.type === 'ice' && '冰度控溫'}
                    </td>
                    <td className="py-3 px-4 text-stone-500">{ing.note || '標準用量'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Step-by-Step Brewing Instructions */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-800" />
            <h3 className="text-lg font-bold text-stone-900">
              02. 職人製作標準流程 SOP (Step-by-Step Instructions)
            </h3>
          </div>

          <div className="space-y-4">
            {activeRecipe.steps.map((step) => (
              <div
                key={step.stepNumber}
                className="bg-stone-50/80 rounded-2xl p-5 border border-stone-200 flex flex-col md:flex-row items-start gap-4"
              >
                <div className="w-9 h-9 rounded-xl bg-stone-900 text-white font-bold text-sm flex items-center justify-center shrink-0">
                  {step.stepNumber}
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h4 className="font-bold text-sm text-stone-900">{step.title}</h4>
                    {step.timing && (
                      <span className="text-[11px] text-amber-800 font-mono bg-amber-100/60 px-2 py-0.5 rounded">
                        計時: {step.timing}
                      </span>
                    )}
                    {step.temperature && (
                      <span className="text-[11px] text-blue-700 font-mono bg-blue-50 px-2 py-0.5 rounded">
                        溫控: {step.temperature}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">{step.detail}</p>
                  {step.tips && (
                    <div className="text-[11px] text-amber-900/90 font-medium pt-1">
                      💡 關鍵訣竅：{step.tips}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Suggested Variations */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-stone-900">
            03. 風味延伸與變化建議 (Suggested Variations)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activeRecipe.variations.map((v, i) => (
              <div
                key={i}
                className="bg-stone-50 rounded-2xl p-5 border border-stone-200 flex flex-col justify-between space-y-3"
              >
                <div>
                  <h4 className="font-bold text-sm text-stone-900">{v.title}</h4>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">{v.description}</p>
                </div>
                <div className="text-[11px] font-mono text-amber-900 bg-white p-2.5 rounded-lg border border-stone-200">
                  調整公式：{v.formulaDiff}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Master Tips */}
        <div className="bg-amber-900/5 rounded-2xl p-6 border border-amber-900/20 space-y-2">
          <h4 className="font-bold text-sm text-amber-950 flex items-center gap-1.5">
            <span>主廚風味關鍵叮嚀 (Master Craft Tips)</span>
          </h4>
          <ul className="list-disc list-inside space-y-1 text-xs text-amber-900">
            {activeRecipe.masterTips.map((tip, idx) => (
              <li key={idx}>{tip}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
