import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { Drink, Topping, CupSize, IceLevel, SugarLevel, PaymentMethod, DiningType, Member } from '../../types';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Check,
  X,
  CreditCard,
  Banknote,
  Smartphone,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  UserCheck,
  Phone,
  Gift,
  Clock,
  ShieldCheck,
  Search,
  QrCode,
} from 'lucide-react';
import { playTapSound, playSelectSound, playCashRegisterSound } from '../../utils/audio';
import { CounterQrModal } from '../common/CounterQrModal';

export const PosSection: React.FC<{
  onNavigateToCustomBuilder: () => void;
  onNavigateToBOM?: () => void;
}> = ({
  onNavigateToCustomBuilder,
  onNavigateToBOM,
}) => {
  const {
    drinks,
    ingredients,
    toppings,
    cart,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    completeCheckout,
    customRecipes,
    getDrinkBOMAnalysis,
    findMemberByPhone,
    approveMember,
  } = useShop();

  // Active Category Filter
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Member Lookup State (結帳報手機號碼確認會員)
  const [memberPhoneInput, setMemberPhoneInput] = useState<string>('');
  const [activeMember, setActiveMember] = useState<Member | null>(null);
  const [memberFeedback, setMemberFeedback] = useState<{
    type: 'success' | 'warning' | 'error';
    message: string;
  } | null>(null);
  const [showCounterQrModal, setShowCounterQrModal] = useState(false);

  // Drink Customization Modal
  const [activeDrink, setActiveDrink] = useState<Drink | null>(null);
  const [modalSize, setModalSize] = useState<CupSize>('L');
  const [modalIce, setModalIce] = useState<IceLevel>('少冰');
  const [modalSugar, setModalSugar] = useState<SugarLevel>('半糖(5分)');
  const [modalToppings, setModalToppings] = useState<Topping[]>([]);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [modalEcoCup, setModalEcoCup] = useState(false);
  const [modalNotes, setModalNotes] = useState('');
  const [showModalBOM, setShowModalBOM] = useState(false);

  // Checkout Drawer / State
  const [diningType, setDiningType] = useState<DiningType>('takeaway');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [otherDiscount, setOtherDiscount] = useState<number>(0);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Cart calculations
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const totalEcoDiscount = cart.reduce((sum, item) => (item.ecoCup ? sum + 5 * item.quantity : sum), 0);
  const totalAmount = Math.max(0, subtotal - totalEcoDiscount - otherDiscount);
  const totalCups = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Cash change calculation
  const tenderedNum = Number(cashTendered) || 0;
  const changeDue = Math.max(0, tenderedNum - totalAmount);

  // Filter drinks
  const filteredDrinks = drinks.filter((d) => {
    if (selectedCategory === 'all') return true;
    return d.category === selectedCategory;
  });

  const openCustomizer = (drink: Drink) => {
    playTapSound();
    setActiveDrink(drink);
    setModalSize('L');
    setModalIce('少冰');
    setModalSugar('微糖(3分)');
    setModalToppings([]);
    setModalQuantity(1);
    setModalEcoCup(false);
    setModalNotes('');
    setShowModalBOM(false);
  };

  const handleModalAddCart = () => {
    if (!activeDrink) return;
    playSelectSound();

    const unitPrice =
      (modalSize === 'L' ? activeDrink.priceL : activeDrink.priceM) +
      modalToppings.reduce((sum, t) => sum + t.price, 0);

    addToCart({
      id: `cart_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      drinkId: activeDrink.id,
      drinkName: activeDrink.name,
      size: modalSize,
      ice: modalIce,
      sugar: modalSugar,
      toppings: modalToppings,
      unitPrice,
      quantity: modalQuantity,
      subtotal: unitPrice * modalQuantity,
      notes: modalNotes.trim(),
      ecoCup: modalEcoCup,
    });

    setActiveDrink(null);
  };

  // Member lookup & manual approval handlers
  const handleSearchMember = (phoneToSearch?: string) => {
    const targetPhone = phoneToSearch !== undefined ? phoneToSearch : memberPhoneInput;
    const clean = targetPhone.replace(/[-\s]/g, '').trim();
    if (!clean) {
      setMemberFeedback({ type: 'warning', message: '請輸入欲查詢的手機號碼' });
      return;
    }

    const found = findMemberByPhone(clean);
    if (!found) {
      setActiveMember(null);
      setMemberFeedback({
        type: 'error',
        message: `查無手機「${targetPhone}」會員。可請顧客手機掃碼申辦或至會員後台建檔！`,
      });
      return;
    }

    setActiveMember(found);
    if (found.verificationStatus === 'approved') {
      setMemberFeedback({
        type: 'success',
        message: `已成功確認會員：${found.name} (${found.memberCode}) · 現有點數 ${found.points} 點`,
      });
      playSelectSound();
    } else if (found.verificationStatus === 'pending_approval') {
      setMemberFeedback({
        type: 'warning',
        message: `找到「${found.name}」的會員申請（目前狀態：待管理者審核中）。免等驗證信，可點選下方「現場審核開通」！`,
      });
    } else {
      setMemberFeedback({
        type: 'error',
        message: `會員「${found.name}」帳號處於停用狀態，請洽店長。`,
      });
    }
  };

  const handleQuickApproveCurrentMember = () => {
    if (!activeMember) return;
    approveMember(activeMember.id, '收銀員現場一鍵審核');
    const updated = {
      ...activeMember,
      verificationStatus: 'approved' as const,
      points: activeMember.points === 0 ? 20 : activeMember.points,
    };
    setActiveMember(updated);
    setMemberFeedback({
      type: 'success',
      message: `已現場審核通過！已為 ${activeMember.name} 啟用會員帳號並贈送迎賓 20 點！`,
    });
    playCashRegisterSound();
  };

  const handleClearMember = () => {
    setActiveMember(null);
    setMemberPhoneInput('');
    setMemberFeedback(null);
    playTapSound();
  };

  const handleCheckout = () => {
    setCheckoutError(null);
    if (cart.length === 0) {
      setCheckoutError('購物車尚無商品');
      return;
    }

    if (paymentMethod === 'cash' && tenderedNum > 0 && tenderedNum < totalAmount) {
      setCheckoutError(`收現金額不足（尚差 NT$${totalAmount - tenderedNum}）`);
      return;
    }

    const res = completeCheckout({
      paymentMethod,
      diningType,
      amountPaid: paymentMethod === 'cash' ? Math.max(tenderedNum, totalAmount) : totalAmount,
      otherDiscount,
      member: activeMember,
    });

    if (!res.success && res.error) {
      setCheckoutError(res.error);
    } else {
      setCashTendered('');
      setActiveMember(null);
      setMemberPhoneInput('');
      setMemberFeedback(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner / Mode selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-stone-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <span>門市收銀點單 (Point of Sale)</span>
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            點選品項自訂甜度冰塊加料 · 售出時系統將即時核銷扣減後台原物料庫存
          </p>
        </div>

        {/* Dining Type segmented toggle */}
        <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl border border-stone-200/80">
          {(
            [
              { id: 'takeaway', label: '外帶自取' },
              { id: 'dine_in', label: '店內享用' },
              { id: 'delivery', label: '外送訂單' },
            ] as { id: DiningType; label: string }[]
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setDiningType(item.id);
                playTapSound();
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                diningType === item.id
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Menu items (8 cols) & Cart sidebar (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Menu Section */}
        <div className="lg:col-span-8 space-y-5">
          {/* Category Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: '全部菜單' },
              { id: 'milk_tea', label: '醇濃鮮乳' },
              { id: 'cheese_foam', label: '芝士奶蓋' },
              { id: 'fruit_tea', label: '鮮果特調' },
              { id: 'classic_tea', label: '原葉純茶' },
              { id: 'specialty', label: '經典特調' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  playTapSound();
                }}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-300'
                }`}
              >
                {cat.label}
              </button>
            ))}

            {onNavigateToBOM && (
              <button
                onClick={onNavigateToBOM}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap bg-stone-100 text-stone-700 border border-stone-200 hover:bg-stone-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-stone-700" />
                <span>BOM 配方成本 ({drinks.length})</span>
              </button>
            )}

            <button
              onClick={onNavigateToCustomBuilder}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>特調研發工坊 ({customRecipes.length})</span>
            </button>
          </div>

          {/* Drinks Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
            {filteredDrinks.map((drink) => {
              const bom = getDrinkBOMAnalysis(drink);
              const isSoldOut = bom.maxCupsL === 0 && bom.maxCupsM === 0;

              return (
                <div
                  key={drink.id}
                  onClick={() => openCustomizer(drink)}
                  className={`bg-white rounded-2xl border p-4 transition-all cursor-pointer flex flex-col justify-between group text-left ${
                    isSoldOut
                      ? 'border-stone-200 opacity-60 bg-stone-50/50'
                      : 'border-stone-200 hover:border-amber-400 hover:shadow-sm'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-[11px] font-medium text-stone-400">{drink.categoryName}</span>
                      <div className="flex items-center gap-1">
                        {isSoldOut ? (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
                            缺料停售
                          </span>
                        ) : (
                          <span className="text-[10px] text-stone-500 font-mono bg-stone-100 px-1.5 py-0.5 rounded">
                            可做 {bom.maxCupsL} 杯
                          </span>
                        )}
                        {drink.tag && (
                          <span className="text-[10px] font-bold text-amber-900 bg-amber-100/70 px-1.5 py-0.5 rounded">
                            {drink.tag}
                          </span>
                        )}
                      </div>
                    </div>
                    <h3 className="font-bold text-sm text-stone-900 group-hover:text-amber-900 transition-colors">
                      {drink.name}
                    </h3>
                    <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed">
                      {drink.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                    <div className="text-xs text-stone-500">
                      <span className="tabular-nums font-bold text-stone-900 text-sm">NT${drink.priceM}</span>
                      <span className="text-[10px] text-stone-400"> (M)</span>
                      <span className="mx-1">/</span>
                      <span className="tabular-nums font-bold text-stone-900 text-sm">NT${drink.priceL}</span>
                      <span className="text-[10px] text-stone-400"> (L)</span>
                    </div>
                    <button
                      className="w-7 h-7 rounded-lg bg-stone-100 group-hover:bg-amber-900 group-hover:text-white text-stone-600 flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Custom recipes banner for quick add */}
          {customRecipes.length > 0 && (
            <div className="bg-stone-50 rounded-2xl border border-stone-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                  <span>已建檔私房特調快捷出單 ({customRecipes.length})</span>
                </h4>
                <button
                  onClick={onNavigateToCustomBuilder}
                  className="text-xs text-amber-900 font-semibold hover:underline"
                >
                  前往特調工坊 →
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {customRecipes.map((rec) => (
                  <div
                    key={rec.id}
                    onClick={() => {
                      playSelectSound();
                      addToCart({
                        id: `cart_${Date.now()}_${rec.id}`,
                        drinkId: 'custom_specialty',
                        drinkName: `✨ ${rec.name}`,
                        size: rec.size,
                        ice: rec.iceLevel,
                        sugar: rec.sugarLevel,
                        toppings: rec.toppingIds
                          .map((tid) => toppings.find((t) => t.id === tid))
                          .filter((t): t is Topping => !!t),
                        unitPrice: rec.calculatedPrice,
                        quantity: 1,
                        subtotal: rec.calculatedPrice,
                        notes: rec.notes || '私房特調',
                        ecoCup: false,
                      });
                    }}
                    className="bg-white p-3 rounded-xl border border-stone-200 hover:border-amber-300 transition-colors flex items-center justify-between cursor-pointer group"
                  >
                    <div>
                      <div className="font-semibold text-xs text-stone-900 group-hover:text-amber-900 truncate">
                        {rec.name}
                      </div>
                      <div className="text-[11px] text-stone-500">
                        {rec.size} · {rec.iceLevel} · {rec.sugarLevel}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-amber-900 tabular-nums">
                        NT${rec.calculatedPrice}
                      </span>
                      <Plus className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-900" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Cart & Checkout Section (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-stone-200 shadow-xs p-5 sticky top-24 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-stone-800" />
              <h2 className="font-bold text-base text-stone-900">購物清單</h2>
              <span className="px-2 py-0.5 bg-stone-100 text-stone-700 font-bold rounded-full text-xs tabular-nums">
                {totalCups} 杯
              </span>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-stone-400 hover:text-rose-600 text-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>清空</span>
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className="py-12 text-center text-stone-400 text-xs space-y-1">
                <ShoppingBag className="w-8 h-8 mx-auto text-stone-300 stroke-1" />
                <p>購物車為空，請點選左側飲品品項</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-stone-50 border border-stone-100 text-xs space-y-1.5"
                >
                  <div className="flex justify-between items-start font-semibold text-stone-900">
                    <span className="truncate pr-2">
                      {item.drinkName} ({item.size})
                    </span>
                    <span className="font-mono tabular-nums shrink-0">NT${item.subtotal}</span>
                  </div>

                  <div className="text-[11px] text-stone-500 flex flex-wrap gap-x-1.5">
                    <span>{item.ice}</span>
                    <span>·</span>
                    <span>{item.sugar}</span>
                    {item.toppings.length > 0 && (
                      <>
                        <span>·</span>
                        <span>+{item.toppings.map((t) => t.name).join('+')}</span>
                      </>
                    )}
                    {item.ecoCup && (
                      <>
                        <span>·</span>
                        <span className="text-emerald-700 font-medium">環保杯 -$5</span>
                      </>
                    )}
                  </div>

                  {item.notes && (
                    <div className="text-[10px] text-stone-400 italic">備註: {item.notes}</div>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-stone-200/60">
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-stone-400 hover:text-rose-600 text-[11px]"
                    >
                      移除
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateCartItemQuantity(item.id, -1)}
                        className="w-5 h-5 rounded-md bg-stone-200 hover:bg-stone-300 flex items-center justify-center cursor-pointer text-stone-700"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-mono font-bold text-xs tabular-nums">{item.quantity}</span>
                      <button
                        onClick={() => updateCartItemQuantity(item.id, 1)}
                        className="w-5 h-5 rounded-md bg-stone-200 hover:bg-stone-300 flex items-center justify-center cursor-pointer text-stone-700"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Member Phone Lookup Section (電話確認會員) */}
          <div className="pt-3 border-t border-stone-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-amber-800" />
                <span>會員電話確認</span>
                <span className="text-[10px] text-stone-400 font-normal">(結帳報手機)</span>
              </label>
              {activeMember && (
                <button
                  type="button"
                  onClick={handleClearMember}
                  className="text-[11px] text-stone-400 hover:text-stone-700 underline cursor-pointer"
                >
                  更換/清除會員
                </button>
              )}
            </div>

            {!activeMember ? (
              <div className="space-y-1.5">
                <div className="flex gap-1.5">
                  <div className="relative flex-1">
                    <input
                      type="tel"
                      placeholder="輸入手機號碼 (如 0912-345-678)"
                      value={memberPhoneInput}
                      onChange={(e) => setMemberPhoneInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSearchMember();
                        }
                      }}
                      className="w-full pl-2.5 pr-2 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-800 font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSearchMember()}
                    className="px-3 py-1.5 bg-amber-800 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    確認會員
                  </button>
                </div>

                {/* Quick test member tags */}
                <div className="flex flex-wrap items-center gap-1 text-[10px] text-stone-400">
                  <span>快速代入測試:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setMemberPhoneInput('0912-345-678');
                      handleSearchMember('0912-345-678');
                    }}
                    className="px-1.5 py-0.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded cursor-pointer"
                  >
                    林柏宇 (已開通)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMemberPhoneInput('0923-456-789');
                      handleSearchMember('0923-456-789');
                    }}
                    className="px-1.5 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded cursor-pointer"
                  >
                    張凱文 (待審核)
                  </button>
                </div>

                {/* Counter QR Code Action */}
                <button
                  type="button"
                  onClick={() => setShowCounterQrModal(true)}
                  className="w-full mt-2 py-1.5 px-2.5 bg-stone-100 hover:bg-amber-100/70 text-stone-700 hover:text-amber-950 border border-stone-200 hover:border-amber-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <QrCode className="w-3.5 h-3.5 text-amber-800" />
                  <span>出示門市加入會員 QR Code 立牌</span>
                </button>
              </div>
            ) : (
              /* Active Member Badge */
              <div
                className={`p-3 rounded-xl border space-y-2 text-xs ${
                  activeMember.verificationStatus === 'approved'
                    ? 'bg-amber-50/70 border-amber-200 text-stone-900'
                    : 'bg-amber-100/60 border-amber-300 text-stone-900'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-stone-900">{activeMember.name}</span>
                      <span className="text-[10px] font-mono text-stone-500">({activeMember.memberCode})</span>
                    </div>
                    <div className="text-[11px] font-mono text-stone-600 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-stone-400" />
                      <span>{activeMember.phone}</span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      activeMember.verificationStatus === 'approved'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-amber-200 text-amber-900 border-amber-400'
                    }`}
                  >
                    {activeMember.verificationStatus === 'approved' ? '正式開通' : '待手動審核'}
                  </span>
                </div>

                {activeMember.verificationStatus === 'approved' ? (
                  <div className="flex items-center justify-between pt-1 border-t border-amber-200/60 text-[11px]">
                    <div className="flex items-center gap-1 text-stone-600">
                      <Gift className="w-3.5 h-3.5 text-amber-700" />
                      <span>現有點數：<strong className="text-amber-800 font-mono">{activeMember.points}</strong> 點</span>
                    </div>
                    <div className="text-emerald-700 font-medium">
                      本次預計獲得 +{Math.floor(totalAmount / 10)} 點
                    </div>
                  </div>
                ) : (
                  /* Pending Member Quick Approval Button */
                  <div className="pt-1.5 border-t border-amber-300/80 space-y-1.5">
                    <p className="text-[11px] text-amber-900">
                      此顧客透過獨立網頁申請，<strong>免等驗證信</strong>，可現場直接為顧客手動確認通過！
                    </p>
                    <button
                      type="button"
                      onClick={handleQuickApproveCurrentMember}
                      className="w-full py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>現場手動審核確認通過 (+20點開通禮)</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Member feedback message */}
            {memberFeedback && !activeMember && (
              <div
                className={`p-2 rounded-lg text-[11px] ${
                  memberFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : memberFeedback.type === 'warning'
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {memberFeedback.message}
              </div>
            )}
          </div>

          {/* Pricing summary */}
          <div className="pt-3 border-t border-stone-100 space-y-1.5 text-xs text-stone-600">
            <div className="flex justify-between">
              <span>品項小計</span>
              <span className="tabular-nums">NT${subtotal}</span>
            </div>
            {totalEcoDiscount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>自備環保杯優惠</span>
                <span className="tabular-nums">-NT${totalEcoDiscount}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-stone-600">
              <span>其他折扣</span>
              <div className="flex items-center gap-1">
                <span>-NT$</span>
                <input
                  type="number"
                  min="0"
                  max={subtotal}
                  value={otherDiscount || ''}
                  placeholder="0"
                  onChange={(e) => setOtherDiscount(Number(e.target.value) || 0)}
                  className="w-14 px-1.5 py-0.5 text-right border border-stone-200 rounded text-xs tabular-nums"
                />
              </div>
            </div>
            {activeMember && activeMember.verificationStatus === 'approved' && (
              <div className="flex justify-between text-amber-800 font-medium bg-amber-50/50 px-2 py-1 rounded-md">
                <span>本次會員回饋積點</span>
                <span className="tabular-nums font-bold">+{Math.floor(totalAmount / 10)} 點</span>
              </div>
            )}
            <div className="flex justify-between items-baseline font-bold text-base text-stone-900 pt-2 border-t border-stone-200">
              <span>應付總額</span>
              <span className="text-xl text-amber-900 tabular-nums">NT${totalAmount}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-semibold text-stone-700 block">支付管道</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  paymentMethod === 'cash'
                    ? 'border-stone-900 bg-stone-900 text-white'
                    : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>現金支付</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('line_pay')}
                className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  paymentMethod === 'line_pay'
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>LINE Pay</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('credit_card')}
                className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  paymentMethod === 'credit_card'
                    ? 'border-stone-900 bg-stone-900 text-white'
                    : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>信用卡</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('apple_pay')}
                className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  paymentMethod === 'apple_pay'
                    ? 'border-stone-900 bg-stone-900 text-white'
                    : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Apple Pay</span>
              </button>
            </div>
          </div>

          {/* Cash input & Change calculation */}
          {paymentMethod === 'cash' && (
            <div className="space-y-2 bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-stone-600 font-medium">顧客實收金額</span>
                <div className="flex items-center gap-1">
                  <span>NT$</span>
                  <input
                    type="number"
                    value={cashTendered}
                    placeholder={String(totalAmount)}
                    onChange={(e) => setCashTendered(e.target.value)}
                    className="w-20 px-2 py-1 text-right border border-stone-300 rounded font-bold tabular-nums text-stone-900 bg-white"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-stone-800 font-bold">
                <span>應找零錢</span>
                <span className="tabular-nums text-amber-900 text-sm">NT${changeDue}</span>
              </div>
              {/* Quick Cash Buttons */}
              <div className="flex gap-1.5 pt-1">
                {[100, 200, 500, 1000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCashTendered(String(amt))}
                    className="flex-1 py-1 text-[11px] bg-white border border-stone-200 rounded hover:bg-stone-100 text-stone-700 font-mono cursor-pointer"
                  >
                    ${amt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {checkoutError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              {checkoutError}
            </div>
          )}

          {/* Checkout CTA */}
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
              cart.length > 0
                ? 'bg-amber-900 hover:bg-amber-800 text-white'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>確認結帳出單 (扣減庫存) · NT${totalAmount}</span>
          </button>
        </div>
      </div>

      {/* Drink Customization Modal */}
      {activeDrink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-stone-200">
            {/* Header */}
            <div className="p-5 border-b border-stone-100 flex items-start justify-between">
              <div>
                <span className="text-[11px] text-amber-900 font-semibold">{activeDrink.categoryName}</span>
                <h3 className="font-bold text-lg text-stone-900">{activeDrink.name}</h3>
                <p className="text-xs text-stone-500 mt-0.5">{activeDrink.description}</p>
              </div>
              <button
                onClick={() => setActiveDrink(null)}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customization Options */}
            <div className="p-5 space-y-4 max-h-[68vh] overflow-y-auto text-xs">
              {/* Cup Size */}
              <div>
                <label className="font-bold text-stone-800 block mb-1.5">杯型規格</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setModalSize('M')}
                    className={`p-2.5 rounded-xl border text-center font-medium cursor-pointer ${
                      modalSize === 'M'
                        ? 'border-amber-900 bg-amber-50 text-amber-950 font-bold'
                        : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    中杯 500ml · NT${activeDrink.priceM}
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalSize('L')}
                    className={`p-2.5 rounded-xl border text-center font-medium cursor-pointer ${
                      modalSize === 'L'
                        ? 'border-amber-900 bg-amber-50 text-amber-950 font-bold'
                        : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    大杯 700ml · NT${activeDrink.priceL}
                  </button>
                </div>
              </div>

              {/* Ice Level */}
              <div>
                <label className="font-bold text-stone-800 block mb-1.5">冰塊溫度</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {(['正常冰', '少冰', '微冰', '去冰', '常溫', '溫熱'] as IceLevel[]).map((ice) => (
                    <button
                      key={ice}
                      type="button"
                      onClick={() => setModalIce(ice)}
                      className={`py-1.5 rounded-lg border text-center cursor-pointer ${
                        modalIce === ice
                          ? 'border-stone-900 bg-stone-900 text-white font-semibold'
                          : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                      }`}
                    >
                      {ice}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sugar Level */}
              <div>
                <label className="font-bold text-stone-800 block mb-1.5">甜度糖度</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      '正常糖(10分)',
                      '少糖(7分)',
                      '半糖(5分)',
                      '微糖(3分)',
                      '一分糖(1分)',
                      '無糖(0分)',
                    ] as SugarLevel[]
                  ).map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setModalSugar(sug)}
                      className={`py-1.5 rounded-lg border text-center cursor-pointer ${
                        modalSugar === sug
                          ? 'border-amber-900 bg-amber-900 text-white font-semibold'
                          : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                      }`}
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toppings Multi-select */}
              <div>
                <label className="font-bold text-stone-800 block mb-1.5">手作配料 (可複選)</label>
                <div className="grid grid-cols-2 gap-2">
                  {toppings.map((top) => {
                    const isSelected = modalToppings.some((t) => t.id === top.id);
                    return (
                      <button
                        key={top.id}
                        type="button"
                        onClick={() => {
                          setModalToppings((prev) =>
                            isSelected ? prev.filter((t) => t.id !== top.id) : [...prev, top]
                          );
                        }}
                        className={`p-2.5 rounded-xl border text-left flex justify-between items-center cursor-pointer ${
                          isSelected
                            ? 'border-amber-900 bg-amber-50 text-amber-950 font-semibold'
                            : 'border-stone-200 hover:border-stone-300 text-stone-700'
                        }`}
                      >
                        <span>{top.name}</span>
                        <span className="font-mono text-amber-900 font-bold">+${top.price}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Eco cup & Notes */}
              <div className="space-y-2 pt-2 border-t border-stone-100">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={modalEcoCup}
                    onChange={(e) => setModalEcoCup(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-stone-700 font-medium">
                    自備環保杯優惠 (每杯現折 NT$5 元，免扣拋棄式紙杯庫存)
                  </span>
                </label>

                <input
                  type="text"
                  placeholder="客製備註 (例如：茶濃、不要吸管、加厚奶蓋等)"
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs"
                />
              </div>

              {/* Live BOM Breakdown & Profit Preview */}
              {(() => {
                const drinkPrice =
                  (modalSize === 'L' ? activeDrink.priceL : activeDrink.priceM) +
                  modalToppings.reduce((s, t) => s + t.price, 0);

                const itemsBreakdown = activeDrink.recipe.map((req) => {
                  const ing = ingredients.find((i) => i.id === req.ingredientId);
                  const amount = modalSize === 'L' ? req.amountL : req.amountM;
                  const cost = Number(((ing?.costPerUnit || 0) * amount).toFixed(2));
                  const isLow = ing ? ing.stock < amount : true;
                  return {
                    name: ing?.name || '未知原料',
                    amount,
                    unit: ing?.unit || 'g',
                    cost,
                    isLow,
                    stock: ing?.stock || 0,
                  };
                });

                if (!modalEcoCup) {
                  const cupIng = ingredients.find(
                    (i) => i.id === (modalSize === 'L' ? 'ing_cup_large' : 'ing_cup_med')
                  );
                  if (cupIng) {
                    itemsBreakdown.push({
                      name: cupIng.name,
                      amount: 1,
                      unit: cupIng.unit,
                      cost: cupIng.costPerUnit,
                      isLow: cupIng.stock < 1,
                      stock: cupIng.stock,
                    });
                  }
                }

                modalToppings.forEach((top) => {
                  const ing = ingredients.find((i) => i.id === top.ingredientId);
                  const cost = Number(((ing?.costPerUnit || 0) * top.amountPerServing).toFixed(2));
                  itemsBreakdown.push({
                    name: `加料: ${top.name}`,
                    amount: top.amountPerServing,
                    unit: ing?.unit || 'g',
                    cost,
                    isLow: ing ? ing.stock < top.amountPerServing : false,
                    stock: ing?.stock || 0,
                  });
                });

                const totalItemCost = Number(itemsBreakdown.reduce((sum, i) => sum + i.cost, 0).toFixed(1));
                const profit = Number((drinkPrice - totalItemCost).toFixed(1));
                const margin = drinkPrice > 0 ? Number(((profit / drinkPrice) * 100).toFixed(1)) : 0;
                const hasLowStock = itemsBreakdown.some((i) => i.isLow);

                return (
                  <div className="bg-stone-50 rounded-xl p-3 border border-stone-200 space-y-2">
                    <div
                      onClick={() => setShowModalBOM(!showModalBOM)}
                      className="flex items-center justify-between cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-1.5 font-bold text-stone-800">
                        <Layers className="w-3.5 h-3.5 text-amber-800" />
                        <span>BOM 原料即時核銷與毛利試算</span>
                        {hasLowStock && (
                          <span className="text-[10px] text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded font-bold">
                            原料吃緊
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-stone-500">
                        <span className="font-mono tabular-nums text-[11px]">
                          成本 NT${totalItemCost} · 毛利 {margin}%
                        </span>
                        {showModalBOM ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </div>
                    </div>

                    {showModalBOM && (
                      <div className="pt-2 border-t border-stone-200/60 space-y-1.5 text-[11px]">
                        <div className="text-stone-400 pb-0.5">
                          出單時系統將自後台庫存即時核銷以下原料：
                        </div>
                        <div className="space-y-1 max-h-36 overflow-y-auto">
                          {itemsBreakdown.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between items-center bg-white px-2.5 py-1 rounded border border-stone-100"
                            >
                              <span className="text-stone-700">
                                {item.name}
                                {item.isLow && (
                                  <span className="text-rose-600 font-bold ml-1">
                                    (庫存僅剩 {item.stock})
                                  </span>
                                )}
                              </span>
                              <span className="font-mono text-stone-500">
                                {item.amount} {item.unit} · NT${item.cost}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between pt-1 text-stone-700 font-semibold border-t border-stone-200/60">
                          <span>單杯食材成本：NT${totalItemCost}</span>
                          <span className="text-amber-900">
                            預估毛利：NT${profit} ({margin}%)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Quantity */}
              <div className="flex items-center justify-between pt-2">
                <span className="font-bold text-stone-800">購買杯數</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setModalQuantity((q) => Math.max(1, q - 1))}
                    className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center font-bold text-stone-700"
                  >
                    -
                  </button>
                  <span className="font-mono font-bold text-sm tabular-nums">{modalQuantity}</span>
                  <button
                    type="button"
                    onClick={() => setModalQuantity((q) => q + 1)}
                    className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center font-bold text-stone-700"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer CTA */}
            <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-stone-400">單杯計價</span>
                <div className="font-bold text-base text-amber-900 tabular-nums">
                  NT$
                  {(modalSize === 'L' ? activeDrink.priceL : activeDrink.priceM) +
                    modalToppings.reduce((sum, t) => sum + t.price, 0)}
                </div>
              </div>

              <button
                type="button"
                onClick={handleModalAddCart}
                className="px-6 py-2.5 bg-amber-900 hover:bg-amber-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>加入購物車 (x{modalQuantity})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Counter Stand QR Code Modal */}
      <CounterQrModal
        isOpen={showCounterQrModal}
        onClose={() => setShowCounterQrModal(false)}
        onOpenPortal={() => {
          setShowCounterQrModal(false);
          window.location.search = '?view=member-portal';
        }}
      />
    </div>
  );
};
