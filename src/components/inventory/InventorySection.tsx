import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { Ingredient, IngredientCategory } from '../../types';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Edit2,
  Trash2,
  ArrowUpRight,
  Phone,
  FileText,
  X,
  Check,
  RotateCcw,
} from 'lucide-react';
import { playTapSound, playSelectSound } from '../../utils/audio';

export const InventorySection: React.FC = () => {
  const {
    ingredients,
    addIngredient,
    updateIngredient,
    deleteIngredient,
    restockIngredient,
    adjustStock,
    stockLogs,
    resetToDefaultData,
  } = useShop();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'inventory' | 'logs'>('inventory');

  // Create/Edit Ingredient Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<IngredientCategory>('tea');
  const [formStock, setFormStock] = useState<number>(1000);
  const [formUnit, setFormUnit] = useState('g');
  const [formSafetyThreshold, setFormSafetyThreshold] = useState<number>(500);
  const [formCostPerUnit, setFormCostPerUnit] = useState<number>(0.8);
  const [formSupplier, setFormSupplier] = useState('');
  const [formSupplierPhone, setFormSupplierPhone] = useState('');
  const [formLeadTimeDays, setFormLeadTimeDays] = useState<number>(3);
  const [formNotes, setFormNotes] = useState('');

  // Quick Restock / Adjust Modal State
  const [actionModal, setActionModal] = useState<{
    type: 'restock' | 'adjust';
    ingredient: Ingredient;
  } | null>(null);
  const [actionAmount, setActionAmount] = useState<number>(0);
  const [actionReason, setActionReason] = useState<string>('');

  const categoryMap: Record<IngredientCategory, string> = {
    tea: '原茶茶葉',
    dairy: '乳製品',
    sweetener: '糖漿香料',
    topping: '加料配料',
    packaging: '包材耗材',
  };

  const openCreateModal = () => {
    playTapSound();
    setEditingId(null);
    setFormName('');
    setFormCategory('tea');
    setFormStock(1000);
    setFormUnit('g');
    setFormSafetyThreshold(500);
    setFormCostPerUnit(0.8);
    setFormSupplier('峰林茶業進口商');
    setFormSupplierPhone('02-2558-8831');
    setFormLeadTimeDays(3);
    setFormNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (ing: Ingredient) => {
    playTapSound();
    setEditingId(ing.id);
    setFormName(ing.name);
    setFormCategory(ing.category);
    setFormStock(ing.stock);
    setFormUnit(ing.unit);
    setFormSafetyThreshold(ing.safetyThreshold);
    setFormCostPerUnit(ing.costPerUnit);
    setFormSupplier(ing.supplier);
    setFormSupplierPhone(ing.supplierPhone);
    setFormLeadTimeDays(ing.leadTimeDays);
    setFormNotes(ing.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingId) {
      updateIngredient(editingId, {
        name: formName.trim(),
        category: formCategory,
        categoryName: categoryMap[formCategory],
        stock: Number(formStock) || 0,
        unit: formUnit.trim(),
        safetyThreshold: Number(formSafetyThreshold) || 0,
        costPerUnit: Number(formCostPerUnit) || 0,
        supplier: formSupplier.trim(),
        supplierPhone: formSupplierPhone.trim(),
        leadTimeDays: Number(formLeadTimeDays) || 1,
        notes: formNotes.trim(),
      });
    } else {
      addIngredient({
        name: formName.trim(),
        category: formCategory,
        categoryName: categoryMap[formCategory],
        stock: Number(formStock) || 0,
        unit: formUnit.trim(),
        safetyThreshold: Number(formSafetyThreshold) || 0,
        costPerUnit: Number(formCostPerUnit) || 0,
        supplier: formSupplier.trim(),
        supplierPhone: formSupplierPhone.trim(),
        leadTimeDays: Number(formLeadTimeDays) || 1,
        notes: formNotes.trim(),
      });
    }

    playSelectSound();
    setIsModalOpen(false);
  };

  const handleActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModal) return;

    if (actionModal.type === 'restock') {
      restockIngredient(actionModal.ingredient.id, actionAmount, actionReason);
    } else {
      adjustStock(actionModal.ingredient.id, actionAmount, actionReason);
    }

    playSelectSound();
    setActionModal(null);
  };

  const filteredIngredients = ingredients.filter((ing) => {
    const matchesCategory = selectedCategory === 'all' || ing.category === selectedCategory;
    const matchesSearch =
      ing.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ing.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ing.supplierPhone.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <Boxes className="w-6 h-6 text-amber-700" />
            <span>後台存貨管理與即時核銷系統</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            前台出售飲品時自動扣減對應配方原物料 · 可自行建立原料、設定安全水位、採購單價與供應商電話
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 bg-amber-900 hover:bg-amber-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>自訂建立新原物料品項</span>
          </button>
          <button
            onClick={() => {
              if (confirm('確定要還原成初始預設原料與銷售資料嗎？')) {
                resetToDefaultData();
              }
            }}
            className="p-2.5 text-stone-500 hover:text-stone-800 border border-stone-200 rounded-xl hover:bg-stone-50 text-xs transition-colors cursor-pointer"
            title="重設示範數據"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs: Inventory List vs Stock Logs */}
      <div className="flex items-center justify-between border-b border-stone-200">
        <div className="flex items-center gap-6">
          <button
            onClick={() => {
              setActiveTab('inventory');
              playTapSound();
            }}
            className={`pb-3 text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === 'inventory'
                ? 'border-b-2 border-amber-900 text-amber-950'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            原物料庫存清冊 ({ingredients.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('logs');
              playTapSound();
            }}
            className={`pb-3 text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'logs'
                ? 'border-b-2 border-amber-900 text-amber-950'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <span>即時核銷與異動日誌</span>
            <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.2 rounded-full tabular-nums">
              {stockLogs.length}
            </span>
          </button>
        </div>
      </div>

      {/* Tab 1: Inventory List */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { id: 'all', label: '全部分類' },
                { id: 'tea', label: '原茶茶葉' },
                { id: 'dairy', label: '乳製品' },
                { id: 'sweetener', label: '糖漿香料' },
                { id: 'topping', label: '加料配料' },
                { id: 'packaging', label: '包材耗材' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    playTapSound();
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-stone-900 text-white'
                      : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="搜尋原料名稱、供應商、電話..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-800 bg-white"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50/80 text-stone-500 border-b border-stone-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">原物料名稱</th>
                    <th className="py-3 px-4 font-semibold">分類</th>
                    <th className="py-3 px-4 font-semibold text-right">現有存量</th>
                    <th className="py-3 px-4 font-semibold text-right">安全存量水位</th>
                    <th className="py-3 px-4 font-semibold text-right">採購單價費用</th>
                    <th className="py-3 px-4 font-semibold">供應商與電話</th>
                    <th className="py-3 px-4 font-semibold">庫存狀態</th>
                    <th className="py-3 px-4 font-semibold text-right">操作管理</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {filteredIngredients.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-stone-400">
                        查無符合條件的原物料品項
                      </td>
                    </tr>
                  ) : (
                    filteredIngredients.map((ing) => {
                      const isLowStock = ing.stock <= ing.safetyThreshold;
                      const isCritical = ing.stock <= ing.safetyThreshold * 0.5;
                      const ratio = Math.min(100, Math.round((ing.stock / (ing.safetyThreshold * 2.5)) * 100));

                      return (
                        <tr key={ing.id} className="hover:bg-stone-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-stone-900">
                            <div>{ing.name}</div>
                            {ing.notes && (
                              <div className="text-[10px] text-stone-400 font-normal truncate max-w-xs">
                                {ing.notes}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-stone-600">{ing.categoryName}</td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold tabular-nums">
                            <span className={isCritical ? 'text-rose-600' : isLowStock ? 'text-amber-700' : 'text-stone-900'}>
                              {ing.stock}
                            </span>
                            <span className="text-stone-400 font-normal ml-0.5">{ing.unit}</span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono tabular-nums text-stone-600">
                            {ing.safetyThreshold}
                            <span className="text-stone-400 font-normal ml-0.5">{ing.unit}</span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono tabular-nums text-stone-900 font-semibold">
                            NT${ing.costPerUnit}
                          </td>
                          <td className="py-3.5 px-4 text-stone-600">
                            <div className="font-medium text-stone-800">{ing.supplier}</div>
                            <div className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-stone-400" />
                              <a
                                href={`tel:${ing.supplierPhone}`}
                                className="hover:text-amber-900 font-mono"
                              >
                                {ing.supplierPhone}
                              </a>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              {isCritical ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>嚴重短缺</span>
                                </span>
                              ) : isLowStock ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>低於安全量</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                                  <Check className="w-3 h-3" />
                                  <span>儲備充足</span>
                                </span>
                              )}
                              {/* Stock ratio mini bar */}
                              <div className="w-20 bg-stone-100 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${
                                    isCritical ? 'bg-rose-500' : isLowStock ? 'bg-amber-500' : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${ratio}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  setActionModal({ type: 'restock', ingredient: ing });
                                  setActionAmount(ing.safetyThreshold);
                                  setActionReason('');
                                }}
                                className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded text-[11px] font-medium cursor-pointer"
                              >
                                進貨
                              </button>
                              <button
                                onClick={() => {
                                  setActionModal({ type: 'adjust', ingredient: ing });
                                  setActionAmount(ing.stock);
                                  setActionReason('');
                                }}
                                className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded text-[11px] font-medium cursor-pointer"
                              >
                                盤點
                              </button>
                              <button
                                onClick={() => openEditModal(ing)}
                                className="p-1 text-stone-400 hover:text-stone-800 rounded hover:bg-stone-100 cursor-pointer"
                                title="編輯原料與設定"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`確定要刪除「${ing.name}」嗎？`)) {
                                    deleteIngredient(ing.id);
                                  }
                                }}
                                className="p-1 text-stone-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
                                title="刪除品項"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Stock Change Logs */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-stone-100 bg-stone-50/50 flex justify-between items-center text-xs">
            <span className="font-semibold text-stone-800">
              即時原物料庫存核銷紀錄流水帳（共 {stockLogs.length} 筆）
            </span>
            <span className="text-stone-500">前台點單時即時寫入</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">異動時間</th>
                  <th className="py-3 px-4 font-semibold">原物料名稱</th>
                  <th className="py-3 px-4 font-semibold">異動類別</th>
                  <th className="py-3 px-4 font-semibold text-right">異動量</th>
                  <th className="py-3 px-4 font-semibold text-right">異動後剩餘存量</th>
                  <th className="py-3 px-4 font-semibold">關聯單號與備註</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700 font-mono">
                {stockLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-stone-50/50">
                    <td className="py-3 px-4 text-stone-500 font-sans">{log.timestamp}</td>
                    <td className="py-3 px-4 font-semibold text-stone-900 font-sans">
                      {log.ingredientName}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      {log.type === 'sale_deduction' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700">
                          銷售核銷扣減
                        </span>
                      )}
                      {log.type === 'restock' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                          進貨補貨入庫
                        </span>
                      )}
                      {log.type === 'adjustment' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700">
                          盤點庫存校正
                        </span>
                      )}
                      {log.type === 'spoilage' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-100 text-stone-700">
                          原料耗損登記
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-bold tabular-nums">
                      <span className={log.changeAmount > 0 ? 'text-emerald-700' : 'text-rose-600'}>
                        {log.changeAmount > 0 ? `+${log.changeAmount}` : log.changeAmount}
                      </span>
                      <span className="text-stone-400 font-normal ml-0.5">{log.unit}</span>
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-stone-900 font-semibold">
                      {log.remainingStock} {log.unit}
                    </td>
                    <td className="py-3 px-4 text-stone-600 font-sans">
                      {log.referenceId && (
                        <span className="font-mono text-stone-900 font-semibold mr-1.5">
                          {log.referenceId}
                        </span>
                      )}
                      <span>{log.note || '—'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Create / Edit Ingredient */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-stone-200">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between">
              <h3 className="font-bold text-base text-stone-900">
                {editingId ? '編輯原物料項目與設定' : '建立新原物料品項與安全存量'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveIngredient} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div className="space-y-1">
                  <label className="font-semibold text-stone-700 block">
                    原物料名稱 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="例如：特選阿薩姆紅茶葉"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1">
                  <label className="font-semibold text-stone-700 block">
                    原物料分類 <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as IngredientCategory)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs bg-white"
                  >
                    <option value="tea">原茶茶葉</option>
                    <option value="dairy">乳製品</option>
                    <option value="sweetener">糖漿香料</option>
                    <option value="topping">加料配料</option>
                    <option value="packaging">包材耗材</option>
                  </select>
                </div>

                {/* Stock & Unit */}
                <div className="space-y-1">
                  <label className="font-semibold text-stone-700 block">
                    當前庫存數量 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs tabular-nums"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-stone-700 block">
                    計量單位 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="g, ml, 個, 支, 包, 箱"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs"
                  />
                </div>

                {/* Safety Threshold & Cost */}
                <div className="space-y-1">
                  <label className="font-semibold text-stone-700 block text-amber-900">
                    安全存量水位 (低於此量觸發警報) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formSafetyThreshold}
                    onChange={(e) => setFormSafetyThreshold(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-amber-300 rounded-lg text-xs tabular-nums bg-amber-50/30"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-stone-700 block text-amber-900">
                    採購單價費用 (NTD) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0"
                    value={formCostPerUnit}
                    onChange={(e) => setFormCostPerUnit(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs tabular-nums"
                  />
                </div>

                {/* Supplier & Phone */}
                <div className="space-y-1">
                  <label className="font-semibold text-stone-700 block">
                    供應商名稱 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="例如：名間茶農契作廠"
                    value={formSupplier}
                    onChange={(e) => setFormSupplier(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-stone-700 block text-amber-900">
                    供應商電話 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="例如：02-2345-6789 或 0912-345-678"
                    value={formSupplierPhone}
                    onChange={(e) => setFormSupplierPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-stone-700 block">預計採購進貨天數 (天)</label>
                  <input
                    type="number"
                    min="1"
                    value={formLeadTimeDays}
                    onChange={(e) => setFormLeadTimeDays(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs tabular-nums"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-stone-700 block">規格說明與存放備註</label>
                  <input
                    type="text"
                    placeholder="常溫防潮、冷藏 4°C 等"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-stone-300 rounded-lg text-stone-600 hover:bg-stone-50 text-xs"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-900 hover:bg-amber-800 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  儲存原物料建檔
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Quick Restock / Stock Adjustment */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 border border-stone-200">
            <h3 className="font-bold text-base text-stone-900 mb-1">
              {actionModal.type === 'restock' ? '進貨補貨登記' : '盤點庫存校正'}
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              {actionModal.ingredient.name} · 當前庫存：{actionModal.ingredient.stock}{' '}
              {actionModal.ingredient.unit}
            </p>

            <form onSubmit={handleActionSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">
                  {actionModal.type === 'restock' ? '本次進貨入庫數量' : '盤點後實際數量'} (
                  {actionModal.ingredient.unit})
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={actionAmount}
                  onChange={(e) => setActionAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-bold tabular-nums"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">備註說明 (選填)</label>
                <input
                  type="text"
                  placeholder={actionModal.type === 'restock' ? '常規進貨單批號' : '月末例行盤點損溢校正'}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActionModal(null)}
                  className="px-3 py-1.5 border border-stone-300 rounded-lg text-stone-600"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-stone-900 text-white rounded-lg font-semibold"
                >
                  確認登記
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
