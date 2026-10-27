import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { Drink, RecipeRequirement, DrinkCategory } from '../../types';
import {
  Layers,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Percent,
  TrendingUp,
  AlertCircle,
  ShoppingBag,
  X,
  Check,
  FileSpreadsheet,
} from 'lucide-react';
import { playTapSound, playSelectSound } from '../../utils/audio';

export const BomSection: React.FC<{ onNavigateToPOS: (drinkId?: string) => void }> = ({
  onNavigateToPOS,
}) => {
  const {
    drinks,
    ingredients,
    allBOMAnalyses,
    addDrink,
    updateDrink,
    deleteDrink,
    updateDrinkBOM,
  } = useShop();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedDrinkId, setExpandedDrinkId] = useState<string | null>(null);

  // Edit BOM Modal State
  const [editingBOMDrink, setEditingBOMDrink] = useState<Drink | null>(null);
  const [bomRows, setBomRows] = useState<{ ingredientId: string; amountM: number; amountL: number }[]>([]);

  // Create / Edit Drink Modal State
  const [drinkModalOpen, setDrinkModalOpen] = useState(false);
  const [editingDrinkId, setEditingDrinkId] = useState<string | null>(null);
  const [drinkName, setDrinkName] = useState('');
  const [drinkEnName, setDrinkEnName] = useState('');
  const [drinkCategory, setDrinkCategory] = useState<DrinkCategory>('milk_tea');
  const [priceM, setPriceM] = useState<number>(60);
  const [priceL, setPriceL] = useState<number>(75);
  const [description, setDescription] = useState('');
  const [tag, setTag] = useState('');

  // Category labels map
  const categoryLabels: Record<string, string> = {
    all: '全部分類',
    milk_tea: '醇濃鮮乳',
    cheese_foam: '芝士奶蓋',
    fruit_tea: '鮮果特調',
    classic_tea: '原葉純茶',
    specialty: '經典特調',
  };

  // Metrics summary
  const totalDrinksCount = drinks.length;
  const avgMarginL =
    allBOMAnalyses.length > 0
      ? (allBOMAnalyses.reduce((sum, a) => sum + a.grossMarginL, 0) / allBOMAnalyses.length).toFixed(1)
      : '0';
  const avgCostL =
    allBOMAnalyses.length > 0
      ? (allBOMAnalyses.reduce((sum, a) => sum + a.totalCostL, 0) / allBOMAnalyses.length).toFixed(1)
      : '0';

  const highestMarginAnalysis = [...allBOMAnalyses].sort((a, b) => b.grossMarginL - a.grossMarginL)[0];

  const filteredAnalyses = allBOMAnalyses.filter(({ drink }) => {
    const matchesCat = selectedCategory === 'all' || drink.category === selectedCategory;
    const matchesSearch =
      drink.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drink.enName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Open Edit BOM Modal
  const openEditBOM = (drink: Drink) => {
    playTapSound();
    setEditingBOMDrink(drink);
    setBomRows(
      drink.recipe.map((r) => ({
        ingredientId: r.ingredientId,
        amountM: r.amountM,
        amountL: r.amountL,
      }))
    );
  };

  const handleAddBOMRow = () => {
    // pick first available ingredient
    const available = ingredients.find((i) => !bomRows.some((r) => r.ingredientId === i.id)) || ingredients[0];
    if (available) {
      setBomRows((prev) => [
        ...prev,
        {
          ingredientId: available.id,
          amountM: 10,
          amountL: 15,
        },
      ]);
    }
  };

  const handleRemoveBOMRow = (index: number) => {
    setBomRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveBOM = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBOMDrink) return;

    updateDrinkBOM(editingBOMDrink.id, bomRows);
    setEditingBOMDrink(null);
  };

  // Open Create/Edit Drink Modal
  const openCreateDrinkModal = () => {
    playTapSound();
    setEditingDrinkId(null);
    setDrinkName('');
    setDrinkEnName('');
    setDrinkCategory('milk_tea');
    setPriceM(60);
    setPriceL(75);
    setDescription('');
    setTag('新上市');
    setDrinkModalOpen(true);
  };

  const openEditDrinkModal = (drink: Drink) => {
    playTapSound();
    setEditingDrinkId(drink.id);
    setDrinkName(drink.name);
    setDrinkEnName(drink.enName);
    setDrinkCategory(drink.category);
    setPriceM(drink.priceM);
    setPriceL(drink.priceL);
    setDescription(drink.description);
    setTag(drink.tag || '');
    setDrinkModalOpen(true);
  };

  const handleSaveDrink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!drinkName.trim()) return;

    if (editingDrinkId) {
      updateDrink(editingDrinkId, {
        name: drinkName.trim(),
        enName: drinkEnName.trim() || drinkName.trim(),
        category: drinkCategory,
        categoryName: categoryLabels[drinkCategory] || '特調',
        priceM: Number(priceM) || 0,
        priceL: Number(priceL) || 0,
        description: description.trim(),
        tag: tag.trim() || undefined,
      });
    } else {
      // Default initial recipe template: tea + milk + cane sugar + straw + sealing film
      const defaultRecipe: RecipeRequirement[] = [
        { ingredientId: 'ing_tea_darjeeling', amountM: 14, amountL: 18 },
        { ingredientId: 'ing_sugar_cane', amountM: 20, amountL: 30 },
        { ingredientId: 'ing_straw_thin', amountM: 1, amountL: 1 },
        { ingredientId: 'ing_sealing_film', amountM: 1, amountL: 1 },
      ];
      addDrink({
        name: drinkName.trim(),
        enName: drinkEnName.trim() || drinkName.trim(),
        category: drinkCategory,
        categoryName: categoryLabels[drinkCategory] || '特調',
        priceM: Number(priceM) || 0,
        priceL: Number(priceL) || 0,
        description: description.trim(),
        tag: tag.trim() || undefined,
        color: '#b45309',
        recipe: defaultRecipe,
      });
    }

    setDrinkModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-amber-700" />
            <span>飲品 BOM 物料清單與毛利分析 (Bill of Materials)</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            設定每款飲品的中杯與大杯原物料配比 · 實時計算食材成本、毛利率與當前庫存可出杯數
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={openCreateDrinkModal}
            className="px-4 py-2 bg-amber-900 hover:bg-amber-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>新增 POS 飲品與 BOM 配方</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <span className="text-xs text-stone-500 font-medium">門市在售飲品數</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-stone-900 tabular-nums">
              {totalDrinksCount}
            </span>
            <span className="text-xs text-stone-400">款標準品項</span>
          </div>
          <span className="text-[11px] text-stone-500 mt-1 block">皆綁定完整原物料 BOM</span>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <span className="text-xs text-stone-500 font-medium">全菜單平均毛利率 (大杯)</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 tabular-nums">
              {avgMarginL}%
            </span>
          </div>
          <span className="text-[11px] text-stone-500 mt-1 block">扣除原料、包材與杯材</span>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <span className="text-xs text-stone-500 font-medium">平均單杯物料成本 (大杯)</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-900 tabular-nums">
              NT${avgCostL}
            </span>
          </div>
          <span className="text-[11px] text-stone-500 mt-1 block">含茶湯、乳品、糖漿、包材</span>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <span className="text-xs text-stone-500 font-medium">最高毛利品項</span>
          <div className="mt-2 truncate">
            <span className="text-base sm:text-lg font-bold text-stone-900 truncate block">
              {highestMarginAnalysis?.drink.name || '—'}
            </span>
            <span className="text-xs text-emerald-700 font-mono font-bold">
              毛利率 {highestMarginAnalysis?.grossMarginL}% (售價 NT${highestMarginAnalysis?.drink.priceL})
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {['all', 'milk_tea', 'cheese_foam', 'fruit_tea', 'classic_tea', 'specialty'].map((catKey) => (
            <button
              key={catKey}
              onClick={() => {
                setSelectedCategory(catKey);
                playTapSound();
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === catKey
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              {categoryLabels[catKey]}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="搜尋飲品名稱..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-800 bg-white"
          />
        </div>
      </div>

      {/* Drink BOM Cards / Detailed List */}
      <div className="space-y-4">
        {filteredAnalyses.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 text-stone-400 text-xs">
            查無符合條件的飲品
          </div>
        ) : (
          filteredAnalyses.map((analysis) => {
            const { drink, items, totalCostM, totalCostL, grossMarginM, grossMarginL, maxCupsL, bottleneckL } =
              analysis;
            const isExpanded = expandedDrinkId === drink.id;

            return (
              <div
                key={drink.id}
                className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden transition-all"
              >
                {/* Summary Row */}
                <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1 max-w-md">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-amber-900 bg-amber-50 px-2 py-0.5 rounded">
                        {drink.categoryName}
                      </span>
                      {drink.tag && (
                        <span className="text-[10px] font-bold text-stone-600 bg-stone-100 px-1.5 py-0.2 rounded">
                          {drink.tag}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-base text-stone-900 flex items-center gap-2">
                      <span>{drink.name}</span>
                      <span className="text-xs text-stone-400 font-normal">{drink.enName}</span>
                    </h3>
                    <p className="text-xs text-stone-500 line-clamp-1">{drink.description}</p>
                  </div>

                  {/* Financial & Stock Matrix */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-stone-400 block">售價 (M / L)</span>
                      <span className="font-bold text-stone-900 tabular-nums">
                        NT${drink.priceM} / NT${drink.priceL}
                      </span>
                    </div>

                    <div>
                      <span className="text-stone-400 block">BOM 物料成本 (L)</span>
                      <span className="font-bold text-stone-800 tabular-nums">
                        NT${totalCostL}
                        <span className="text-[10px] text-stone-400 font-normal"> (含包材)</span>
                      </span>
                    </div>

                    <div>
                      <span className="text-stone-400 block">毛利率 (M / L)</span>
                      <div className="flex items-baseline gap-1 font-bold">
                        <span className={grossMarginM >= 65 ? 'text-emerald-700' : 'text-amber-700'}>
                          {grossMarginM}%
                        </span>
                        <span className="text-stone-400">/</span>
                        <span className={grossMarginL >= 65 ? 'text-emerald-700' : 'text-amber-700'}>
                          {grossMarginL}%
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-stone-400 block">現存原物料可做 (L)</span>
                      <div className="font-bold tabular-nums">
                        <span className={maxCupsL <= 15 ? 'text-rose-600' : 'text-stone-900'}>
                          {maxCupsL} 杯
                        </span>
                        {bottleneckL && (
                          <span className="text-[10px] text-stone-400 block font-normal truncate max-w-[120px]">
                            受限於: {bottleneckL.ingredientName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-stone-100">
                    <button
                      onClick={() => setExpandedDrinkId(isExpanded ? null : drink.id)}
                      className="px-3 py-1.5 border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>{isExpanded ? '收合配方表' : '展開 BOM 明細'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => openEditBOM(drink)}
                      className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      title="調整配方原料與用量"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>編輯 BOM</span>
                    </button>

                    <button
                      onClick={() => onNavigateToPOS(drink.id)}
                      className="px-3 py-1.5 bg-amber-900 hover:bg-amber-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                      title="前台點單出杯"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>點單</span>
                    </button>
                  </div>
                </div>

                {/* Expanded BOM Table */}
                {isExpanded && (
                  <div className="bg-stone-50/70 border-t border-stone-200 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-stone-900">
                        【{drink.name}】精準原物料 BOM 消耗定額與成本明細表
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-stone-500">
                        <span>
                          中杯總成本：<strong className="text-stone-900">NT${totalCostM}</strong> (毛利 NT${drink.priceM - totalCostM} / {grossMarginM}%)
                        </span>
                        <span>·</span>
                        <span>
                          大杯總成本：<strong className="text-stone-900">NT${totalCostL}</strong> (毛利 NT${drink.priceL - totalCostL} / {grossMarginL}%)
                        </span>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-stone-100/70 text-stone-600 border-b border-stone-200">
                          <tr>
                            <th className="py-2.5 px-3.5 font-semibold">原物料品項</th>
                            <th className="py-2.5 px-3.5 font-semibold">分類</th>
                            <th className="py-2.5 px-3.5 font-semibold text-right">採購單價</th>
                            <th className="py-2.5 px-3.5 font-semibold text-right">中杯用量 (500ml)</th>
                            <th className="py-2.5 px-3.5 font-semibold text-right">中杯成本</th>
                            <th className="py-2.5 px-3.5 font-semibold text-right">大杯用量 (700ml)</th>
                            <th className="py-2.5 px-3.5 font-semibold text-right">大杯成本</th>
                            <th className="py-2.5 px-3.5 font-semibold text-right">現有存量</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 text-stone-700">
                          {items.map((item, idx) => (
                            <tr key={idx} className="hover:bg-stone-50/50">
                              <td className="py-2.5 px-3.5 font-medium text-stone-900">{item.ingredientName}</td>
                              <td className="py-2.5 px-3.5 text-stone-500">{item.categoryName}</td>
                              <td className="py-2.5 px-3.5 text-right font-mono tabular-nums text-stone-500">
                                NT${item.costPerUnit}/{item.unit}
                              </td>
                              <td className="py-2.5 px-3.5 text-right font-mono font-semibold tabular-nums">
                                {item.amountM} {item.unit}
                              </td>
                              <td className="py-2.5 px-3.5 text-right font-mono tabular-nums text-stone-600">
                                NT${item.costM}
                              </td>
                              <td className="py-2.5 px-3.5 text-right font-mono font-semibold tabular-nums text-amber-900">
                                {item.amountL} {item.unit}
                              </td>
                              <td className="py-2.5 px-3.5 text-right font-mono tabular-nums text-stone-900 font-semibold">
                                NT${item.costL}
                              </td>
                              <td className="py-2.5 px-3.5 text-right font-mono tabular-nums">
                                <span className={item.stock <= 500 ? 'text-rose-600 font-bold' : 'text-stone-700'}>
                                  {item.stock} {item.unit}
                                </span>
                              </td>
                            </tr>
                          ))}

                          {/* Standard Packaging line */}
                          <tr className="bg-stone-50/50 font-medium text-stone-600 border-t border-stone-200">
                            <td className="py-2 px-3.5" colSpan={3}>
                              標配外帶包材 (環保紙杯 + 粗/細吸管 + 消光封口膜)
                            </td>
                            <td className="py-2 px-3.5 text-right font-mono">1套</td>
                            <td className="py-2 px-3.5 text-right font-mono text-stone-700">NT$2.1</td>
                            <td className="py-2 px-3.5 text-right font-mono">1套</td>
                            <td className="py-2 px-3.5 text-right font-mono text-stone-700">NT$2.4</td>
                            <td className="py-2 px-3.5 text-right text-stone-400">充足</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => openEditDrinkModal(drink)}
                        className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900 border border-stone-200 rounded-lg hover:bg-white cursor-pointer"
                      >
                        編輯基本售價與描述
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`確定要下架刪除【${drink.name}】嗎？`)) {
                            deleteDrink(drink.id);
                          }
                        }}
                        className="px-3 py-1.5 text-xs text-rose-600 hover:text-rose-800 border border-rose-200 rounded-lg hover:bg-rose-50 cursor-pointer"
                      >
                        下架刪除飲品
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Edit BOM Modal */}
      {editingBOMDrink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-stone-200">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-stone-900">
                  編輯 BOM 原料配方：{editingBOMDrink.name}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  設定售出此款飲品時，系統於後台即時核銷扣減的每項原料與精確用量
                </p>
              </div>
              <button
                onClick={() => setEditingBOMDrink(null)}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBOM} className="p-6 space-y-5 text-xs">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-800">BOM 原料配比清單 ({bomRows.length} 項)</span>
                  <button
                    type="button"
                    onClick={handleAddBOMRow}
                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>添加原料</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {bomRows.map((row, idx) => {
                    const currentIng = ingredients.find((i) => i.id === row.ingredientId);
                    return (
                      <div
                        key={idx}
                        className="bg-stone-50 p-3 rounded-xl border border-stone-200 flex items-center gap-3"
                      >
                        {/* Ingredient select */}
                        <div className="flex-1">
                          <label className="text-[10px] text-stone-400 block mb-0.5">原物料品項</label>
                          <select
                            value={row.ingredientId}
                            onChange={(e) => {
                              const newId = e.target.value;
                              setBomRows((prev) =>
                                prev.map((r, i) => (i === idx ? { ...r, ingredientId: newId } : r))
                              );
                            }}
                            className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-lg bg-white"
                          >
                            {ingredients.map((ing) => (
                              <option key={ing.id} value={ing.id}>
                                {ing.name} ({ing.categoryName} · {ing.stock}{ing.unit})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Amount M */}
                        <div className="w-24">
                          <label className="text-[10px] text-stone-400 block mb-0.5">
                            中杯量 ({currentIng?.unit || 'g'})
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={row.amountM}
                            onChange={(e) => {
                              const val = Number(e.target.value) || 0;
                              setBomRows((prev) =>
                                prev.map((r, i) => (i === idx ? { ...r, amountM: val } : r))
                              );
                            }}
                            className="w-full px-2 py-1.5 text-xs border border-stone-300 rounded-lg font-mono tabular-nums bg-white"
                          />
                        </div>

                        {/* Amount L */}
                        <div className="w-24">
                          <label className="text-[10px] text-stone-400 block mb-0.5">
                            大杯量 ({currentIng?.unit || 'g'})
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={row.amountL}
                            onChange={(e) => {
                              const val = Number(e.target.value) || 0;
                              setBomRows((prev) =>
                                prev.map((r, i) => (i === idx ? { ...r, amountL: val } : r))
                              );
                            }}
                            className="w-full px-2 py-1.5 text-xs border border-stone-300 rounded-lg font-mono tabular-nums bg-white font-semibold text-amber-900"
                          />
                        </div>

                        {/* Remove */}
                        <div className="pt-4">
                          <button
                            type="button"
                            onClick={() => handleRemoveBOMRow(idx)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 rounded cursor-pointer"
                            title="移除此項原料"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingBOMDrink(null)}
                  className="px-4 py-2 border border-stone-300 rounded-lg text-stone-600 hover:bg-stone-50 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-900 hover:bg-amber-800 text-white rounded-lg font-semibold cursor-pointer shadow-xs"
                >
                  儲存 BOM 配方
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create / Edit Drink Modal */}
      {drinkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-stone-200">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between">
              <h3 className="font-bold text-base text-stone-900">
                {editingDrinkId ? '編輯 POS 飲品設定' : '新增 POS 飲品品項'}
              </h3>
              <button
                onClick={() => setDrinkModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDrink} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">
                    飲品名稱 (中文) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="例如：蜜香伯爵鮮奶茶"
                    value={drinkName}
                    onChange={(e) => setDrinkName(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">英文名稱</label>
                  <input
                    type="text"
                    placeholder="Earl Grey Fresh Milk Tea"
                    value={drinkEnName}
                    onChange={(e) => setDrinkEnName(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">
                    所屬分類 <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={drinkCategory}
                    onChange={(e) => setDrinkCategory(e.target.value as DrinkCategory)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs bg-white"
                  >
                    <option value="milk_tea">醇濃鮮乳</option>
                    <option value="cheese_foam">芝士奶蓋</option>
                    <option value="fruit_tea">鮮果特調</option>
                    <option value="classic_tea">原葉純茶</option>
                    <option value="specialty">經典特調</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">宣傳標籤 (選填)</label>
                  <input
                    type="text"
                    placeholder="例如：人氣新品、店長推薦"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">
                    中杯售價 (M NT$) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={priceM}
                    onChange={(e) => setPriceM(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">
                    大杯售價 (L NT$) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={priceL}
                    onChange={(e) => setPriceL(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono font-bold text-amber-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">口感風味描述</label>
                <textarea
                  rows={2}
                  placeholder="介紹茶韻層次、奶香厚度與推薦喝法..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDrinkModalOpen(false)}
                  className="px-4 py-2 border border-stone-300 rounded-lg text-stone-600 hover:bg-stone-50 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-900 hover:bg-amber-800 text-white rounded-lg font-semibold cursor-pointer shadow-xs"
                >
                  確認建立飲品
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
