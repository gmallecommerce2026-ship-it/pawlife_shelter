'use client';

import React, { useState } from 'react';
import { X, Pencil, Check } from 'lucide-react';
import { AdoptionApplication } from '@/types/application';

export interface RequiredDocument {
  key: string;
  label: string;
  description: string;
}

const DOCUMENT_TYPE_OPTIONS: RequiredDocument[] = [
  {
    key: 'landlord_consent',
    label: 'Chấp thuận từ chủ nhà',
    description:
      'Nếu bạn đang thuê nhà, chúng mình cần sự đồng ý từ chủ nhà để đảm bảo được phép nuôi thú cưng tại nơi ở của bạn.',
  },
  {
    key: 'income_verification',
    label: 'Xác minh thu nhập',
    description:
      'Cung cấp bằng chứng thu nhập ổn định (bảng lương, sao kê ngân hàng...) để đảm bảo khả năng chăm sóc thú cưng lâu dài.',
  },
  {
    key: 'identity_document',
    label: 'Giấy tờ tùy thân',
    description: 'Ảnh chụp CMND/CCCD hoặc hộ chiếu còn hiệu lực để xác minh danh tính người đăng ký.',
  },
  {
    key: 'residence_confirmation',
    label: 'Xác nhận nơi cư trú',
    description: 'Hóa đơn điện nước hoặc hợp đồng thuê nhà xác nhận địa chỉ cư trú hiện tại.',
  },
  {
    key: 'other',
    label: 'Tài liệu khác',
    description: 'Mô tả loại tài liệu khác mà bạn cần người đăng ký bổ sung.',
  },
];

interface RequestDocumentsModalProps {
  application: AdoptionApplication;
  onClose: () => void;
  /** Gọi khi xác nhận danh sách tài liệu cần yêu cầu -> board sẽ mở tiếp NeedMoreInfoModal hiện tại */
  onNext: (documents: RequiredDocument[]) => void;
}

export const RequestDocumentsModal: React.FC<RequestDocumentsModalProps> = ({ onClose, onNext }) => {
  // Mặc định chọn sẵn "Chấp thuận từ chủ nhà", giống trạng thái mở đầu trong thiết kế
  const [selectedKeys, setSelectedKeys] = useState<string[]>(['landlord_consent']);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [descriptions, setDescriptions] = useState<Record<string, string>>(() =>
    Object.fromEntries(DOCUMENT_TYPE_OPTIONS.map((o) => [o.key, o.description]))
  );

  const toggleSelect = (key: string) => {
    setSelectedKeys((prev) => {
      const isSelected = prev.includes(key);
      if (isSelected) {
        if (editingKey === key) setEditingKey(null);
        return prev.filter((k) => k !== key);
      }
      if (key === 'other') setEditingKey('other');
      return [...prev, key];
    });
  };

  const toggleEdit = (e: React.MouseEvent, key: string) => {
    e.stopPropagation();
    setEditingKey((prev) => (prev === key ? null : key));
  };

  const updateDescription = (key: string, value: string) => {
    setDescriptions((prev) => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    if (selectedKeys.length === 0) return;
    const documents: RequiredDocument[] = DOCUMENT_TYPE_OPTIONS.filter((o) => selectedKeys.includes(o.key)).map(
      (o) => ({ key: o.key, label: o.label, description: descriptions[o.key] })
    );
    onNext(documents);
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[28px] shadow-2xl w-full max-w-[480px] max-h-[90vh] overflow-y-auto p-6 flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[20px] font-bold text-[#0D062D]">Tài liệu yêu cầu</h2>
            <p className="text-[13px] text-gray-500 mt-1">Chọn các loại tài liệu cần bổ sung từ người đăng ký</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors shrink-0 mt-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Một khối duy nhất: mục đã chọn hiện mở rộng, mục chưa chọn hiện dạng dòng đơn */}
        <div className="border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100">
          {DOCUMENT_TYPE_OPTIONS.map((option) => {
            const isSelected = selectedKeys.includes(option.key);

            if (!isSelected) {
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => toggleSelect(option.key)}
                  className="w-full text-left px-4 py-3.5 text-[14px] font-medium text-black hover:bg-gray-50 transition-colors"
                >
                  {option.label}
                </button>
              );
            }

            return (
              <div key={option.key} className="p-4 flex flex-col gap-2 bg-white">
                <div className="flex items-start justify-between gap-2">
                  <button type="button" onClick={() => toggleSelect(option.key)} className="flex items-center gap-2 text-left">
                    <span className="w-4 h-4 rounded-full bg-[#E89B5A] flex items-center justify-center shrink-0">
                      <Check size={10} className="text-white" strokeWidth={3} />
                    </span>
                    <span className="text-[14px] font-semibold text-[#E89B5A]">{option.label}</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => toggleEdit(e, option.key)}
                    title="Chỉnh sửa nội dung yêu cầu"
                    className="text-gray-400 hover:text-[#E89B5A] transition-colors shrink-0 p-1 -m-1"
                  >
                    <Pencil size={14} />
                  </button>
                </div>
                {editingKey === option.key ? (
                  <textarea
                    autoFocus
                    rows={3}
                    value={descriptions[option.key]}
                    onChange={(e) => updateDescription(option.key, e.target.value)}
                    onBlur={() => setEditingKey(null)}
                    placeholder="Nhập nội dung yêu cầu bổ sung..."
                    className="w-full bg-[#F9FAFB] border border-gray-200 rounded-xl px-3 py-2 text-[12.5px] text-gray-600 leading-relaxed outline-none resize-none focus:border-[#E89B5A]"
                  />
                ) : (
                  <p className="text-[12.5px] text-gray-500 leading-relaxed pl-6">{descriptions[option.key]}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Nút bấm */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-[46px] rounded-xl border border-gray-200 bg-white text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={selectedKeys.length === 0}
            className="flex-1 h-[46px] rounded-xl bg-[#E89B5A] hover:bg-[#D68B4E] disabled:opacity-50 text-white font-bold text-sm shadow-sm transition-colors"
          >
            Gửi yêu cầu
          </button>
        </div>
      </div>
    </div>
  );
};