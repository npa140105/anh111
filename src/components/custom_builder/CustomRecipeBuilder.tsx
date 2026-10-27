import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { CupSize, IceLevel, SugarLevel, CustomRecipe } from '../../types';
import { Sparkles, Plus, Trash2, Check, ShoppingBag, Bookmark, Info } from 'lucide-react';
import { playTapSound, playSelectSound } from '../../utils/audio';

export const CustomRecipeBuilder: React.FC = () => {
  const {
    ingredients,
    toppings,
    saveCustomRecipe,
    customRecipes,
    deleteCustomRecipe,
    addCustomRecipeToCart,
  } = useShop();

  // Recipe Builder Form State
  const [recipeName, setRecipeName] = useState('午後私房波霸厚乳');
  const [notes, setNotes] = useState('茶香厚重，奶泡綿密，珍珠Q彈');
  const [size, setSize] = useState<CupSize>('L');
  const [selectedTeaId, setSelectedTeaId] = useState('ing_tea_darjeeling');
  const [selectedMilkId, setSelectedMilkId] = useState<string>('ing_milk_fresh');
  const [selectedSweetenerId, setSelectedSweetenerId] = useState('ing_sugar_brown');
  const [sugarLevel, setSugarLevel] = useState<SugarLevel>('半糖(5分)');
  const [iceLevel, setIceLevel] = useState<IceLevel>('少冰');
  const [selectedToppingIds, setSelectedToppingIds] = useState<string[]>(['top_boba']);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // Available options filtered from ingredients
  const teaOptions = ingredients.filter((i) => i.category === 'tea');
  const milkOptions = [
    { id: 'none', name: '無添加乳品 (純茶系)', desc: '清新回甘，低熱量無負擔' },
    ...ingredients
      .filter((i) => i.category === 'dairy')
      .map((i) => ({ id: i.id, name: i.name, desc: `${i.stock > 0 ? '庫存充足' : '需進貨'}` })),
  ];
  const sweetenerOptions = ingredients.filter((i) => i.category === 'sweetener');

  const toggleTopping = (toppingId: string) => {
    playTapSound();
    setSelectedToppingIds((prev) =>
      prev.includes(toppingId) ? prev.filter((id) => id !== toppingId) : [...prev, toppingId]
    );
  };

  // Price Calculation Logic
  const calculatePrice = () => {
    let base = size === 'L' ? 45 : 35;
    if (selectedMilkId !== 'none') base += 25;
    if (selectedSweetenerId === 'ing_sugar_brown') base += 10;
    if (selectedTeaId === 'ing_tea_matcha') base += 15;

    const toppingsCost = selectedToppingIds.reduce((sum, tid) => {
      const top = toppings.find((t) => t.id === tid);
      return sum + (top ? top.price : 0);
    }, 0);

    return base + toppingsCost;
  };

  const currentPrice = calculatePrice();

  // Dynamic visual styling for cup simulation
  const getTeaVisualColor = () => {
    switch (selectedTeaId) {
      case 'ing_tea_matcha':
        return '#3f6212'; // matcha green
      case 'ing_tea_darjeeling':
        return '#854d0e'; // dark amber
      case 'ing_tea_jasmine':
        return '#a16207'; // golden green
      case 'ing_tea_tieguanyin':
        return '#78350f'; // deep roasted brown
      case 'ing_tea_spring':
        return '#15803d'; // fresh oolong
      default:
        return '#9a3412';
    }
  };

  const handleSaveRecipe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipeName.trim()) return;

    saveCustomRecipe({
      name: recipeName.trim(),
      teaId: selectedTeaId,
      milkId: selectedMilkId === 'none' ? undefined : selectedMilkId,
      sweetenerId: selectedSweetenerId,
      sugarLevel,
      iceLevel,
      size,
      toppingIds: selectedToppingIds,
      notes: notes.trim(),
      calculatedPrice: currentPrice,
    });

    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-amber-700" />
          <span>特調工坊 · 自訂手作配方實驗室</span>
        </h1>
        <p className="text-sm text-stone-500 mt-1 max-w-2xl">
          隨心挑選基底茶湯、生鮮乳品、手作甜度、豐富配料與冰度比例。即時預覽杯身視覺分層，計算門市建議售價並儲存為私房特調配方。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Visual Cup Preview & Live Recipe Specs (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-stone-200 p-6 shadow-xs sticky top-24">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100">
            <div>
              <span className="text-xs font-semibold text-stone-400">即時視覺流動預覽</span>
              <h3 className="font-bold text-lg text-stone-900 truncate max-w-xs">{recipeName || '我的特調'}</h3>
            </div>
            <div className="text-right">
              <span className="text-xs text-stone-500">預估售價</span>
              <p className="text-xl font-bold text-amber-900 tabular-nums">NT${currentPrice}</p>
            </div>
          </div>

          {/* Interactive Boba Cup Visualization */}
          <div className="py-8 flex justify-center items-center">
            <div className="relative w-44 h-72 flex flex-col items-center">
              {/* Straw */}
              <div className="w-4 h-24 bg-amber-200/90 rounded-full -mb-6 z-20 shadow-xs transform rotate-6 border border-amber-300" />

              {/* Cup Lid */}
              <div className="w-40 h-6 bg-stone-200/80 rounded-t-xl z-10 border border-stone-300/80 shadow-xs flex items-center justify-center">
                <div className="w-8 h-2 bg-stone-300 rounded-full" />
              </div>

              {/* Cup Body (Translucent Plastic Cup) */}
              <div
                className={`w-38 relative rounded-b-3xl overflow-hidden border-2 border-stone-300/70 shadow-inner flex flex-col justify-end transition-all duration-300 ${
                  size === 'L' ? 'h-64' : 'h-52'
                }`}
                style={{
                  background: 'linear-gradient(to bottom, rgba(255,255,255,0.7), rgba(245,245,244,0.4))',
                }}
              >
                {/* Floating Ice Cubes Layer */}
                {iceLevel !== '去冰' && iceLevel !== '常溫' && iceLevel !== '溫熱' && (
                  <div className="absolute top-4 inset-x-3 z-10 flex justify-around opacity-75">
                    <div className="w-6 h-6 bg-white/70 rounded-md border border-white rotate-12 shadow-xs backdrop-blur-xs" />
                    <div className="w-7 h-7 bg-white/60 rounded-md border border-white -rotate-6 shadow-xs backdrop-blur-xs" />
                    {iceLevel === '正常冰' && (
                      <div className="w-5 h-5 bg-white/80 rounded-md border border-white rotate-45 shadow-xs" />
                    )}
                  </div>
                )}

                {/* Milk Layer / Cream Cloud */}
                {selectedMilkId !== 'none' && (
                  <div
                    className="absolute top-0 inset-x-0 h-16 z-5 transition-all duration-300"
                    style={{
                      background:
                        selectedMilkId === 'ing_cheese_powder'
                          ? 'linear-gradient(to bottom, #fef3c7 0%, rgba(254,243,199,0.3) 100%)'
                          : 'linear-gradient(to bottom, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.2) 100%)',
                    }}
                  />
                )}

                {/* Liquid Tea Gradient Body */}
                <div
                  className="w-full h-full transition-colors duration-500 flex flex-col justify-end"
                  style={{
                    backgroundColor: getTeaVisualColor(),
                    opacity: selectedMilkId !== 'none' ? 0.8 : 0.9,
                  }}
                >
                  {/* Brown sugar tiger stripe effect */}
                  {selectedSweetenerId === 'ing_sugar_brown' && (
                    <div className="absolute inset-0 bg-gradient-to-t from-amber-950/80 via-transparent to-transparent pointer-events-none" />
                  )}

                  {/* Settled Toppings in Cup Bottom */}
                  {selectedToppingIds.length > 0 && (
                    <div className="w-full min-h-16 bg-amber-950/40 p-2 z-10 flex flex-wrap gap-1 items-end justify-center">
                      {selectedToppingIds.includes('top_boba') && (
                        <div className="flex gap-1 flex-wrap justify-center py-1">
                          {[...Array(14)].map((_, i) => (
                            <span
                              key={i}
                              className="w-3.5 h-3.5 rounded-full bg-stone-900 border border-amber-900/60 shadow-xs inline-block animate-pulse"
                              style={{ animationDelay: `${i * 90}ms`, animationDuration: '3s' }}
                            />
                          ))}
                        </div>
                      )}
                      {selectedToppingIds.includes('top_coconut') && (
                        <div className="flex gap-1 flex-wrap justify-center">
                          {[...Array(6)].map((_, i) => (
                            <span
                              key={i}
                              className="w-3 h-2.5 rounded-xs bg-white/80 border border-white shadow-xs inline-block"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick summary badges */}
          <div className="bg-stone-50 rounded-xl p-4 space-y-2 border border-stone-100 text-xs text-stone-600">
            <div className="flex justify-between">
              <span className="text-stone-400">基底茶湯</span>
              <span className="font-semibold text-stone-800">
                {teaOptions.find((t) => t.id === selectedTeaId)?.name || '未選擇'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">乳品搭配</span>
              <span className="font-semibold text-stone-800">
                {milkOptions.find((m) => m.id === selectedMilkId)?.name || '無'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">甜度與糖漿</span>
              <span className="font-semibold text-stone-800">
                {sweetenerOptions.find((s) => s.id === selectedSweetenerId)?.name} · {sugarLevel}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">冰塊比例</span>
              <span className="font-semibold text-stone-800">{iceLevel}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-stone-400">加料內容</span>
              <span className="font-semibold text-stone-800 text-right">
                {selectedToppingIds.length > 0
                  ? selectedToppingIds
                      .map((id) => toppings.find((t) => t.id === id)?.name)
                      .filter(Boolean)
                      .join('、')
                  : '無加料'}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex flex-col gap-2.5">
            <button
              onClick={() => {
                const tempRecipe: CustomRecipe = {
                  id: `temp_${Date.now()}`,
                  name: recipeName || '私房特調飲品',
                  createdAt: '剛剛',
                  teaId: selectedTeaId,
                  milkId: selectedMilkId === 'none' ? undefined : selectedMilkId,
                  sweetenerId: selectedSweetenerId,
                  sugarLevel,
                  iceLevel,
                  size,
                  toppingIds: selectedToppingIds,
                  notes,
                  calculatedPrice: currentPrice,
                };
                addCustomRecipeToCart(tempRecipe, 1);
              }}
              className="w-full py-2.5 px-4 bg-amber-900 hover:bg-amber-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>直接加入 POS 點單購物車 (NT${currentPrice})</span>
            </button>
          </div>
        </div>

        {/* Right Column: Customization Controls Form (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs">
          <form onSubmit={handleSaveRecipe} className="space-y-6">
            {/* Step 1: Recipe Identity */}
            <div className="space-y-3 pb-6 border-b border-stone-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-900 tracking-wide">
                  01. 特調配方名稱與手作備註
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSize('M');
                      playTapSound();
                    }}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      size === 'M' ? 'bg-amber-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    中杯 (500ml)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSize('L');
                      playTapSound();
                    }}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      size === 'L' ? 'bg-amber-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    大杯 (700ml)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="例如：初戀百香抹茶白玉"
                  value={recipeName}
                  onChange={(e) => setRecipeName(e.target.value)}
                  className="px-3.5 py-2 text-sm border border-stone-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-800"
                />
                <input
                  type="text"
                  placeholder="口感描述或研發備註"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="px-3.5 py-2 text-sm border border-stone-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-800"
                />
              </div>
            </div>

            {/* Step 2: Base Tea Selection */}
            <div className="space-y-2.5 pb-6 border-b border-stone-100">
              <label className="text-xs font-bold text-stone-900 tracking-wide block">
                02. 選擇茶湯基底 (Tea Base)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {teaOptions.map((tea) => (
                  <button
                    key={tea.id}
                    type="button"
                    onClick={() => {
                      setSelectedTeaId(tea.id);
                      playTapSound();
                    }}
                    className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                      selectedTeaId === tea.id
                        ? 'border-amber-900 bg-amber-50/50 text-amber-950 font-semibold ring-1 ring-amber-900'
                        : 'border-stone-200 hover:border-stone-300 text-stone-700 bg-stone-50/30'
                    }`}
                  >
                    <div className="text-xs">{tea.name}</div>
                    <div className="text-[11px] text-stone-400 mt-1">存量 {tea.stock}{tea.unit}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Dairy Option */}
            <div className="space-y-2.5 pb-6 border-b border-stone-100">
              <label className="text-xs font-bold text-stone-900 tracking-wide block">
                03. 選擇乳品搭配 (Milk / Cream Option)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {milkOptions.map((milk) => (
                  <button
                    key={milk.id}
                    type="button"
                    onClick={() => {
                      setSelectedMilkId(milk.id);
                      playTapSound();
                    }}
                    className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                      selectedMilkId === milk.id
                        ? 'border-amber-900 bg-amber-50/50 text-amber-950 font-semibold ring-1 ring-amber-900'
                        : 'border-stone-200 hover:border-stone-300 text-stone-700 bg-stone-50/30'
                    }`}
                  >
                    <div className="text-xs">{milk.name}</div>
                    <div className="text-[11px] text-stone-400 mt-1">{milk.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 4: Sweetener & Sugar Level */}
            <div className="space-y-3 pb-6 border-b border-stone-100">
              <label className="text-xs font-bold text-stone-900 tracking-wide block">
                04. 糖類選擇與甜度規格 (Sweetener & Sugar Level)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {sweetenerOptions.map((sugar) => (
                  <button
                    key={sugar.id}
                    type="button"
                    onClick={() => {
                      setSelectedSweetenerId(sugar.id);
                      playTapSound();
                    }}
                    className={`p-2.5 text-center rounded-lg border text-xs transition-colors cursor-pointer ${
                      selectedSweetenerId === sugar.id
                        ? 'border-amber-900 bg-amber-900 text-white font-medium'
                        : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    {sugar.name}
                  </button>
                ))}
              </div>

              {/* Sugar Level Buttons */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-1">
                {(
                  [
                    '正常糖(10分)',
                    '少糖(7分)',
                    '半糖(5分)',
                    '微糖(3分)',
                    '一分糖(1分)',
                    '無糖(0分)',
                  ] as SugarLevel[]
                ).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => {
                      setSugarLevel(lvl);
                      playTapSound();
                    }}
                    className={`py-1.5 px-1 text-center rounded-md text-xs transition-colors cursor-pointer ${
                      sugarLevel === lvl
                        ? 'bg-stone-900 text-white font-medium'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                    }`}
                  >
                    {lvl.replace(/\(.*\)/, '')}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 5: Ice Level */}
            <div className="space-y-2 pb-6 border-b border-stone-100">
              <label className="text-xs font-bold text-stone-900 tracking-wide block">
                05. 冰塊溫度比例 (Ice Level)
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {(['正常冰', '少冰', '微冰', '去冰', '常溫', '溫熱'] as IceLevel[]).map((ice) => (
                  <button
                    key={ice}
                    type="button"
                    onClick={() => {
                      setIceLevel(ice);
                      playTapSound();
                    }}
                    className={`py-2 text-center rounded-lg text-xs transition-colors cursor-pointer ${
                      iceLevel === ice
                        ? 'bg-amber-900 text-white font-medium'
                        : 'border border-stone-200 hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    {ice}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 6: Toppings Selection */}
            <div className="space-y-2 pb-6 border-b border-stone-100">
              <label className="text-xs font-bold text-stone-900 tracking-wide block">
                06. 手作豐富配料 (Add-in Toppings)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {toppings.map((top) => {
                  const isChecked = selectedToppingIds.includes(top.id);
                  return (
                    <button
                      key={top.id}
                      type="button"
                      onClick={() => toggleTopping(top.id)}
                      className={`p-3 text-left rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                        isChecked
                          ? 'border-amber-900 bg-amber-50 text-amber-950 font-semibold'
                          : 'border-stone-200 hover:border-stone-300 text-stone-700'
                      }`}
                    >
                      <div>
                        <div className="text-xs">{top.name}</div>
                        <div className="text-[11px] text-amber-800 font-mono">+NT${top.price}</div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                          isChecked ? 'bg-amber-900 text-white' : 'border border-stone-300'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Form Submit & Feedback */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2 text-xs text-stone-500">
                <Info className="w-4 h-4 text-stone-400" />
                <span>儲存後配方將持久化儲存於門市私房庫</span>
              </div>
              <button
                type="submit"
                className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Bookmark className="w-4 h-4" />
                <span>儲存配方至私房庫</span>
              </button>
            </div>

            {saveSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in duration-200">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>配方「{recipeName}」已成功儲存！可於下方私房庫隨時一鍵出單點餐。</span>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Saved Custom Recipes Section */}
      <div className="pt-6 border-t border-stone-200 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-stone-900">我的門市私房特調庫 ({customRecipes.length})</h2>
            <p className="text-xs text-stone-500 mt-0.5">點擊「加入點單」可立即在前台 POS 銷售出杯</p>
          </div>
        </div>

        {customRecipes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 text-stone-400 text-xs">
            尚未儲存任何私房配方，請於上方特調工坊創造您的第一杯飲品！
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customRecipes.map((rec) => {
              const baseTea = ingredients.find((i) => i.id === rec.teaId);
              const toppingNames = rec.toppingIds
                .map((id) => toppings.find((t) => t.id === id)?.name)
                .filter(Boolean);

              return (
                <div
                  key={rec.id}
                  className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between hover:border-amber-300 transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-stone-900 text-sm">{rec.name}</h4>
                        <span className="text-[11px] text-stone-400">{rec.createdAt} 建檔</span>
                      </div>
                      <span className="text-base font-bold text-amber-900 tabular-nums">
                        NT${rec.calculatedPrice}
                      </span>
                    </div>

                    <div className="text-xs text-stone-600 space-y-1 bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                      <div>基底：{baseTea?.name || '特調茶'} ({rec.size})</div>
                      <div>規格：{rec.iceLevel} · {rec.sugarLevel}</div>
                      {toppingNames.length > 0 && (
                        <div>配料：{toppingNames.join('、')}</div>
                      )}
                      {rec.notes && (
                        <div className="text-[11px] text-stone-400 italic pt-1 border-t border-stone-200/60">
                          備註: {rec.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => deleteCustomRecipe(rec.id)}
                      className="p-2 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      title="刪除配方"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => addCustomRecipeToCart(rec, 1)}
                      className="px-3.5 py-1.5 bg-amber-900 hover:bg-amber-800 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>加入 POS 點單</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
