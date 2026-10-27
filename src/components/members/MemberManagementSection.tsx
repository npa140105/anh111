import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { Member, MemberVerificationStatus } from '../../types';
import {
  Users,
  UserCheck,
  Clock,
  Search,
  Plus,
  CheckCircle2,
  XCircle,
  QrCode,
  Smartphone,
  ExternalLink,
  Gift,
  Calendar,
  Phone,
  Mail,
  Edit2,
  Trash2,
  Printer,
  ChevronRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { playCashRegisterSound, playTapSound } from '../../utils/audio';
import { QRCodeDisplay } from '../common/QRCodeDisplay';

export const MemberManagementSection: React.FC<{
  onOpenStandalonePortal: () => void;
}> = ({ onOpenStandalonePortal }) => {
  const {
    members,
    pendingMembersCount,
    approveMember,
    rejectMember,
    deleteMember,
    registerMember,
  } = useShop();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | MemberVerificationStatus>('all');
  const [showQrModal, setShowQrModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Manual Add Member State
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newBirthday, setNewBirthday] = useState('');
  const [newSugar, setNewSugar] = useState('微糖(3分)');
  const [newIce, setNewIce] = useState('少冰');
  const [newNotes, setNewNotes] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  // Filter members
  const filteredMembers = members.filter((m) => {
    // Status filter
    if (statusFilter !== 'all' && m.verificationStatus !== statusFilter) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const phoneDigits = m.phone.replace(/[-\s]/g, '');
      const searchDigits = q.replace(/[-\s]/g, '');
      const matchPhone = phoneDigits.includes(searchDigits) || m.phone.includes(q);
      const matchName = m.name.toLowerCase().includes(q);
      const matchCode = m.memberCode.toLowerCase().includes(q);
      const matchEmail = m.email.toLowerCase().includes(q);
      return matchPhone || matchName || matchCode || matchEmail;
    }
    return true;
  });

  const totalPoints = members.reduce((sum, m) => sum + m.points, 0);
  const approvedCount = members.filter((m) => m.verificationStatus === 'approved').length;

  const handleApproveAll = () => {
    const pendingList = members.filter((m) => m.verificationStatus === 'pending_approval');
    pendingList.forEach((m) => approveMember(m.id, '門市店長 (批次確認)'));
    playCashRegisterSound();
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    const res = await registerMember({
      name: newName,
      phone: newPhone,
      email: newEmail,
      birthday: newBirthday,
      preferredSugar: newSugar,
      preferredIce: newIce,
      notes: newNotes,
    });

    if (res.success && res.member) {
      // In-store addition by manager: immediately approve!
      await approveMember(res.member.id, '櫃檯人員現場建檔');
      setShowAddModal(false);
      setNewName('');
      setNewPhone('');
      setNewEmail('');
      setNewBirthday('');
      setNewNotes('');
      playCashRegisterSound();
    } else {
      setAddError(res.error || '建立失敗');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-stone-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-800" />
            <span>會員資料管理與管理者審核中心</span>
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            顧客可透過獨立網頁申請會員 · 免收驗證信，由管理者於此處手動審核開通 · 結帳時輸入手機號碼即查會員
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQrModal(true)}
            className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-xl border border-stone-300/70 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-amber-800" />
            <span>櫃檯掃碼立牌 QR Code</span>
          </button>

          <button
            onClick={onOpenStandalonePortal}
            className="px-3.5 py-2 bg-amber-800 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            <span>開啟顧客申請獨立網頁</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>門市手動建檔</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Approval */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            pendingMembersCount > 0
              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/20'
              : 'bg-white border-stone-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span className="font-semibold text-stone-700">待手動審核申請</span>
            <Clock className={`w-4 h-4 ${pendingMembersCount > 0 ? 'text-amber-600 animate-pulse' : 'text-stone-400'}`} />
          </div>
          <div className="text-2xl font-bold text-amber-800 font-mono mt-1">
            {pendingMembersCount}
            <span className="text-xs text-stone-500 font-normal ml-1">位待確認</span>
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            {pendingMembersCount > 0 ? (
              <span className="text-amber-700 font-medium">免等信箱驗證，點擊下方手動審核即可開通</span>
            ) : (
              <span>目前所有申請皆已完成審核</span>
            )}
          </div>
        </div>

        {/* Approved Members */}
        <div className="p-4 rounded-2xl bg-white border border-stone-200">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span className="font-semibold text-stone-700">正式開通會員</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-stone-900 font-mono mt-1">
            {approvedCount}
            <span className="text-xs text-stone-500 font-normal ml-1">位啟用中</span>
          </div>
          <div className="text-[11px] text-stone-500 mt-1">結帳時報手機號碼即可享優惠與集點</div>
        </div>

        {/* Total Members */}
        <div className="p-4 rounded-2xl bg-white border border-stone-200">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span className="font-semibold text-stone-700">登記會員總數</span>
            <Users className="w-4 h-4 text-stone-500" />
          </div>
          <div className="text-2xl font-bold text-stone-900 font-mono mt-1">
            {members.length}
            <span className="text-xs text-stone-500 font-normal ml-1">人</span>
          </div>
          <div className="text-[11px] text-stone-500 mt-1">包含獨立網頁線上申請與門市建檔</div>
        </div>

        {/* Total Points */}
        <div className="p-4 rounded-2xl bg-white border border-stone-200">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span className="font-semibold text-stone-700">累計流通紅利點數</span>
            <Gift className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-900 font-mono mt-1">
            {totalPoints.toLocaleString()}
            <span className="text-xs text-stone-500 font-normal ml-1">點</span>
          </div>
          <div className="text-[11px] text-stone-500 mt-1">開通即贈 20 點 · 消費滿 10 元贈 1 點</div>
        </div>
      </div>

      {/* Pending Approval Fast-Track Banner */}
      {pendingMembersCount > 0 && (
        <div className="bg-linear-to-r from-amber-50 via-amber-100/50 to-amber-50 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-amber-950 flex items-center gap-2">
                <span>有 {pendingMembersCount} 位顧客透過獨立網頁送出會員申請，等待管理者手動確認！</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-200 text-amber-900">
                  免信箱驗證
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-0.5">
                使用者免翻找驗證信！由管理員在後台點選「手動確認通過」後，系統將自動贈送 <strong>20 點</strong> 迎賓點數並開通會員帳號。
              </p>
            </div>
          </div>

          <button
            onClick={handleApproveAll}
            className="px-4 py-2 bg-amber-800 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>一鍵全部審核通過 ({pendingMembersCount})</span>
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="搜尋手機號碼 (如 0912)、姓名或信箱..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-800/20 focus:border-amber-800"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: `全部會員 (${members.length})` },
            { id: 'pending_approval', label: `待手動確認 (${pendingMembersCount})` },
            { id: 'approved', label: `已審核啟用 (${approvedCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id as any);
                playTapSound();
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">會員編號 / 姓名</th>
                <th className="py-3 px-4">手機號碼 (結帳查詢鍵)</th>
                <th className="py-3 px-4">電子郵件信箱</th>
                <th className="py-3 px-4">審核驗證狀態</th>
                <th className="py-3 px-4 text-center">累計點數</th>
                <th className="py-3 px-4 text-right">累計消費</th>
                <th className="py-3 px-4">客製喜好</th>
                <th className="py-3 px-4 text-right">管理者審核操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400">
                    <Users className="w-8 h-8 mx-auto text-stone-300 stroke-1 mb-2" />
                    <p>查無符合條件的會員紀錄</p>
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr
                    key={member.id}
                    className={`hover:bg-stone-50/80 transition-colors ${
                      member.verificationStatus === 'pending_approval' ? 'bg-amber-50/30' : ''
                    }`}
                  >
                    {/* Code & Name */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-stone-900">{member.name}</div>
                      <div className="font-mono text-[11px] text-stone-400">{member.memberCode}</div>
                    </td>

                    {/* Phone */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span className="font-mono font-bold text-stone-800 text-xs tracking-wider">
                          {member.phone}
                        </span>
                      </div>
                      <div className="text-[10px] text-stone-400 mt-0.5">
                        申辦日: {member.registeredAt?.split(' ')[0]}
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-stone-600">
                        <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span className="truncate max-w-[160px]">{member.email}</span>
                      </div>
                      <span className="inline-block text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded mt-0.5">
                        免信箱驗證 · 手動確認
                      </span>
                    </td>

                    {/* Verification Status */}
                    <td className="py-3 px-4">
                      {member.verificationStatus === 'pending_approval' ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold animate-pulse">
                          <Clock className="w-3 h-3 text-amber-700" />
                          <span>待管理者手動確認</span>
                        </div>
                      ) : member.verificationStatus === 'approved' ? (
                        <div>
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>已審核通過</span>
                          </div>
                          {member.approvedBy && (
                            <div className="text-[10px] text-stone-400 mt-0.5">
                              由 {member.approvedBy} 核准
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px]">
                          <XCircle className="w-3 h-3" />
                          <span>已停用</span>
                        </span>
                      )}
                    </td>

                    {/* Points */}
                    <td className="py-3 px-4 text-center">
                      <span className="font-mono font-bold text-amber-800 text-sm">
                        {member.points}
                      </span>
                      <span className="text-[10px] text-stone-400 block">點</span>
                    </td>

                    {/* Total Spent */}
                    <td className="py-3 px-4 text-right">
                      <div className="font-mono font-semibold text-stone-800">
                        NT${member.totalSpent}
                      </div>
                      <div className="text-[10px] text-stone-400">{member.orderCount} 筆訂單</div>
                    </td>

                    {/* Preferences */}
                    <td className="py-3 px-4 text-stone-600">
                      <div>
                        {member.preferredSugar || '微糖'} · {member.preferredIce || '少冰'}
                      </div>
                      {member.birthday && (
                        <div className="text-[10px] text-stone-400">生日: {member.birthday}</div>
                      )}
                    </td>

                    {/* Admin Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {member.verificationStatus === 'pending_approval' ? (
                        <button
                          onClick={() => approveMember(member.id, '門市店長')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>手動確認通過 (贈20點)</span>
                        </button>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedMember(member);
                            }}
                            className="px-2.5 py-1 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer text-xs"
                          >
                            檢視詳情
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`確定要刪除會員 ${member.name} (${member.phone}) 嗎？`)) {
                                deleteMember(member.id);
                              }
                            }}
                            className="p-1 text-stone-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="刪除會員"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Code Standalone Portal Poster Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-stone-200">
            <div className="bg-stone-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-base">門市現場櫃檯 QR Code 申請立牌</span>
              </div>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-stone-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Printable Counter Display Poster */}
            <div className="p-8 text-center space-y-5 bg-stone-50">
              <div className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
                BobaFlow 顧客專屬加入會員
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-black text-stone-900">手機掃碼 · 立即申辦享好禮</h3>
                <p className="text-xs text-stone-500">免等驗證信！填寫送出後直接向店員報電話即享迎賓 20 點</p>
              </div>

              {/* Real Scannable QR Code Frame */}
              <div className="py-2 flex justify-center">
                <QRCodeDisplay
                  value={
                    typeof window !== 'undefined'
                      ? `${window.location.origin}${window.location.pathname}?view=member-portal`
                      : 'https://bobaflow.club/members'
                  }
                  size={190}
                  title="掃描線上申辦會員"
                  subtitle="支援 iPhone / Android 相機直掃"
                  centerText="BF"
                  showDownload={true}
                  showCopy={true}
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 text-xs text-amber-900 space-y-1 text-left">
                <div className="font-bold flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-amber-800" />
                  <span>門市櫃檯立牌操作指引：</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  可列印此立牌擺放於櫃檯收銀機前。客人用相機對準掃描後，將連至獨立會員申請頁面填寫；結帳時直接報登記電話，收銀員即可現場一鍵開通啟用！
                </p>
              </div>
            </div>

            <div className="p-4 bg-white border-t border-stone-200 flex justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 border border-stone-300 rounded-xl text-xs font-semibold text-stone-700 hover:bg-stone-50 flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>列印立牌</span>
              </button>
              <button
                onClick={() => {
                  setShowQrModal(false);
                  onOpenStandalonePortal();
                }}
                className="px-4 py-2 bg-amber-800 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>直接前往該獨立申請網頁</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-stone-200">
            <div className="bg-stone-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-base">門市現場手動建檔會員</span>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-stone-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMember} className="p-6 space-y-4">
              {addError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                  {addError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700">會員姓名 *</label>
                <input
                  type="text"
                  required
                  placeholder="例：陳大華"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-800/20 focus:border-amber-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700">手機號碼 (結帳查詢鍵) *</label>
                <input
                  type="tel"
                  required
                  placeholder="例：0912-345-678"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-800/20 focus:border-amber-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700">電子信箱 *</label>
                <input
                  type="email"
                  required
                  placeholder="例：user@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-800/20 focus:border-amber-800"
                />
                <span className="text-[10px] text-amber-700">由店員現場建檔將自動審核開通，免等郵件驗證</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-700">甜度偏好</label>
                  <select
                    value={newSugar}
                    onChange={(e) => setNewSugar(e.target.value)}
                    className="w-full p-2 text-xs bg-stone-50 border border-stone-200 rounded-xl"
                  >
                    <option value="微糖(3分)">微糖(3分)</option>
                    <option value="半糖(5分)">半糖(5分)</option>
                    <option value="無糖(0分)">無糖(0分)</option>
                    <option value="少糖(7分)">少糖(7分)</option>
                    <option value="正常糖(10分)">正常糖(10分)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-700">冰量偏好</label>
                  <select
                    value={newIce}
                    onChange={(e) => setNewIce(e.target.value)}
                    className="w-full p-2 text-xs bg-stone-50 border border-stone-200 rounded-xl"
                  >
                    <option value="少冰">少冰</option>
                    <option value="微冰">微冰</option>
                    <option value="去冰">去冰</option>
                    <option value="正常冰">正常冰</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700">備註事項</label>
                <input
                  type="text"
                  placeholder="例：門市常客、偏好燕麥奶"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-800/20 focus:border-amber-800"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-stone-300 rounded-xl text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-800 hover:bg-amber-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
                >
                  建立並直接開通會員 (+20點)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Member Detail Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-stone-200">
            <div className="bg-stone-900 text-white p-4 flex items-center justify-between">
              <span className="font-bold text-sm">會員檔案詳情 · {selectedMember.name}</span>
              <button
                onClick={() => setSelectedMember(null)}
                className="text-stone-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 bg-stone-50 rounded-2xl border border-stone-200">
                <div>
                  <span className="text-[10px] text-stone-400">會員編號</span>
                  <div className="font-mono font-bold text-stone-900 text-sm">{selectedMember.memberCode}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-stone-400">會員狀態</span>
                  <div className="font-bold text-emerald-700">
                    {selectedMember.verificationStatus === 'approved' ? '已正式開通' : '待審核'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
                  <span className="text-[10px] text-stone-400">手機號碼 (結帳報此號)</span>
                  <div className="font-mono font-bold text-stone-900 text-sm mt-0.5">{selectedMember.phone}</div>
                </div>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
                  <span className="text-[10px] text-stone-400">累積點數</span>
                  <div className="font-mono font-bold text-amber-800 text-base mt-0.5">{selectedMember.points} 點</div>
                </div>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
                  <span className="text-[10px] text-stone-400">累積消費金額</span>
                  <div className="font-mono font-bold text-stone-900 text-sm mt-0.5">NT${selectedMember.totalSpent}</div>
                </div>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
                  <span className="text-[10px] text-stone-400">累計消費筆數</span>
                  <div className="font-mono font-bold text-stone-900 text-sm mt-0.5">{selectedMember.orderCount} 筆</div>
                </div>
              </div>

              <div className="space-y-1.5 p-3 bg-stone-50 rounded-xl border border-stone-100">
                <div className="flex justify-between">
                  <span className="text-stone-500">電子信箱：</span>
                  <span className="font-mono text-stone-900">{selectedMember.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">審核方式：</span>
                  <span className="text-stone-900">管理者手動確認 (免信箱驗證)</span>
                </div>
                {selectedMember.approvedBy && (
                  <div className="flex justify-between">
                    <span className="text-stone-500">核准人：</span>
                    <span className="text-stone-900">{selectedMember.approvedBy}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-stone-500">飲品習慣偏好：</span>
                  <span className="text-stone-900">
                    {selectedMember.preferredSugar || '微糖'} / {selectedMember.preferredIce || '少冰'}
                  </span>
                </div>
                {selectedMember.notes && (
                  <div className="flex justify-between">
                    <span className="text-stone-500">備註資訊：</span>
                    <span className="text-stone-900">{selectedMember.notes}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end">
              <button
                onClick={() => setSelectedMember(null)}
                className="px-5 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
