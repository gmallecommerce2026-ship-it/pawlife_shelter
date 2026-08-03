'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  MeasuringStrategy,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { KANBAN_COLUMNS, ApplicationStatus, AdoptionApplication } from '@/types/application';
import { useApplicationList, useApplicationActions } from '@/stores/useApplicationStore';
import { ApplicationColumn } from './components/ApplicationColumn';
import { ApplicationCardContent } from './components/ApplicationCard';
import { ApplicationDetailModal } from './components/ApplicationDetailModal';
import { ApplicationFilterBar } from './components/ApplicationFilterBar';
import { ApplicantProfileModal } from '@/components/ApplicantProfileModal';
import { AllDocumentsModal } from './components/AllDocumentsModal';
import { ApplicationQuickViewModal } from './components/ApplicationQuickViewModal';
import { InterviewScheduleModal } from './components/InterviewScheduleModal';
import { ApproveApplicationModal } from './components/ApproveApplicationModal';
import { NeedMoreInfoModal } from './components/NeedMoreInfoModal';
import { MoveToPendingModal } from './components/MoveToPendingModal';
const isColumnId = (id: string | number) =>
  KANBAN_COLUMNS.some((c) => c.status === id);

export const ApplicationKanbanBoard: React.FC = () => {
  const { items, isLoading, movingIds } = useApplicationList();
  const { fetchApplications, moveApplication } = useApplicationActions();
  const [quickViewApp, setQuickViewApp] = useState<AdoptionApplication | null>(null);
  const [localItems, setLocalItems] = useState<AdoptionApplication[]>(items);
  const isDraggingRef = useRef(false);
  const [approveApp, setApproveApp] = useState<AdoptionApplication | null>(null);
  const [interviewApp, setInterviewApp] = useState<AdoptionApplication | null>(null);
  const [needInfoApp, setNeedInfoApp] = useState<AdoptionApplication | null>(null);
  const [pendingApp, setPendingApp] = useState<AdoptionApplication | null>(null);
  // 1. THÊM STATE VÀ REF ĐỂ KIỂM TRA SCROLL NGANG
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isScrollable, setIsScrollable] = useState(false);


  useEffect(() => {
    if (!isDraggingRef.current) {
      setLocalItems(items);
    }
  }, [items]);

  const [activeApp, setActiveApp] = useState<AdoptionApplication | null>(null);
  const [selectedApp, setSelectedApp] = useState<AdoptionApplication | null>(null);
  const [overColumn, setOverColumn] = useState<ApplicationStatus | null>(null);
  const [profileApp, setProfileApp] = useState<AdoptionApplication | null>(null);
  const [documentsApp, setDocumentsApp] = useState<AdoptionApplication | null>(null);

  useEffect(() => {
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const REQUIRES_CONFIRM: ApplicationStatus[] = ['CLOSED'];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // FIX: thay closestCenter bằng collision detection tùy biến.
  // Lý do: mỗi cột giờ vừa là droppable bao ngoài (cột), vừa chứa các card cũng
  // là droppable lồng bên trong (sortable) — cộng thêm cột giờ có scroll nội bộ
  // (overflow-y-auto). closestCenter chỉ so khoảng cách tâm nên rất dễ đo nhầm/
  // đo hụt "over" đúng trong tình huống droppable lồng nhau này, dẫn đến kéo
  // card sang cột khác không nhận được (không move được).
  // Cách xử lý chuẩn (theo khuyến nghị chính thức của dnd-kit cho multi-container
  // sortable board): ưu tiên pointerWithin — đo theo VỊ TRÍ CON TRỎ thực tế đang
  // nằm trong droppable/sortable nào, chính xác hơn nhiều với case lồng nhau.
  const collisionDetection: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args);

    if (pointerCollisions.length > 0) {
      // Con trỏ đang hover trúng 1 CARD cụ thể (không phải id của cột) -> ưu
      // tiên trả về card đó, để reorder/chèn đúng vị trí đang hover thay vì bị
      // "nuốt" bởi droppable cột bao ngoài (cả 2 đều match vì card nằm lồng
      // trong cột).
      const cardCollision = pointerCollisions.find((c) => !isColumnId(c.id));
      if (cardCollision) return [cardCollision];

      // Con trỏ không trúng card nào (đang ở vùng trống của cột: dưới card
      // cuối, hoặc cột đang rỗng) -> dùng thẳng collision với cột.
      return pointerCollisions;
    }

    // Con trỏ đang ở ngoài mọi droppable đã đo (VD: khoảng hở mỏng giữa 2 cột
    // lúc kéo nhanh, hoặc rìa board) -> fallback rectIntersection để vẫn bắt
    // được cột gần nhất, tránh mất droppable hoàn toàn và không thả được.
    return rectIntersection(args);
  };

  const columns = useMemo(
    () =>
      KANBAN_COLUMNS.map((col) => ({
        ...col,
        applications: localItems.filter((a) => a.status === col.status),
      })),
    [localItems]
  );

  useEffect(() => {
    const checkScrollable = () => {
      if (scrollContainerRef.current) {
        const { scrollWidth, clientWidth } = scrollContainerRef.current;
        // Nếu nội dung thực tế (scrollWidth) lớn hơn khung hiển thị (clientWidth) -> có cuộn ngang
        setIsScrollable(scrollWidth > clientWidth);
      }
    };

    // Chạy kiểm tra sau khi DOM render xong
    const timer = setTimeout(checkScrollable, 100);

    // Lắng nghe sự kiện người dùng thay đổi kích thước cửa sổ trình duyệt
    window.addEventListener('resize', checkScrollable);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkScrollable);
    };
  }, [columns]);
  const handleDragStart = (event: DragStartEvent) => {
    isDraggingRef.current = true;
    const app = localItems.find((a) => a.id === event.active.id);
    setActiveApp(app ?? null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) {
      setOverColumn(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;
    if (activeId === overId) return;

    const activeItem = localItems.find((a) => a.id === activeId);
    if (!activeItem) return;

    const overIsColumn = isColumnId(overId);
    const overItem = localItems.find((a) => a.id === overId);
    const targetStatus = overIsColumn ? (overId as ApplicationStatus) : overItem?.status;
    if (!targetStatus) return;

    setOverColumn(targetStatus);

    setLocalItems((prev) => {
      const oldIndex = prev.findIndex((a) => a.id === activeId);
      if (oldIndex === -1) return prev;

      if (activeItem.status === targetStatus && !overIsColumn && overItem) {
        const newIndex = prev.findIndex((a) => a.id === overId);
        if (newIndex === -1 || newIndex === oldIndex) return prev;
        return arrayMove(prev, oldIndex, newIndex);
      }

      if (activeItem.status !== targetStatus) {
        const next = [...prev];
        next[oldIndex] = { ...next[oldIndex], status: targetStatus };
        if (!overIsColumn && overItem) {
          const newIndex = next.findIndex((a) => a.id === overId);
          return arrayMove(next, oldIndex, newIndex);
        }
        return next;
      }

      return prev;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    isDraggingRef.current = false;
    setActiveApp(null);
    setOverColumn(null);

    const activeId = active.id as string;
    const originalItem = items.find((a) => a.id === activeId);

    if (!over || !originalItem) {
      setLocalItems(items);
      return;
    }

    const finalItem = localItems.find((a) => a.id === activeId);
    if (!finalItem || finalItem.status === originalItem.status) return;

    if (finalItem.status === 'PENDING' && originalItem.status === 'SUBMITTED') {
      // Rollback thẻ về cột cũ, mở modal
      setLocalItems((prev) => prev.map((a) => (a.id === activeId ? { ...a, status: originalItem.status } : a)));
      setPendingApp(originalItem);
      return;
    }

    // ----- THÊM MỚI: BẮT SỰ KIỆN KHI KÉO VÀO CỘT PHỎNG VẤN -----
    if (finalItem.status === 'NEED_MORE_INFO' && originalItem.status === 'PENDING') {
      // Rollback thẻ về cột cũ, mở modal
      setLocalItems((prev) => prev.map((a) => (a.id === activeId ? { ...a, status: originalItem.status } : a)));
      setNeedInfoApp(originalItem);
      return;
    }

    if (finalItem.status === 'INTERVIEW_SCHEDULED') {
      // Rollback UI lại cột cũ cho đến khi submit Form thành công
      setLocalItems((prev) =>
        prev.map((a) => (a.id === activeId ? { ...a, status: originalItem.status } : a))
      );
      setInterviewApp(originalItem);
      return;
    }

    if (finalItem.status === 'APPROVED' && originalItem.status === 'INTERVIEW_SCHEDULED') {
      // Rollback thẻ về cột cũ, mở modal
      setLocalItems((prev) => prev.map((a) => (a.id === activeId ? { ...a, status: originalItem.status } : a)));
      setApproveApp(originalItem);
      return;
    }
    // -----------------------------------------------------------

    if (REQUIRES_CONFIRM.includes(finalItem.status)) {
      setLocalItems((prev) =>
        prev.map((a) => (a.id === activeId ? { ...a, status: originalItem.status } : a))
      );
      setSelectedApp(originalItem);
      return;
    }

    moveApplication(activeId, finalItem.status);
  };

  return (
    <div className="flex flex-col justify-start gap-6 sm:gap-[40px] w-full overflow-hidden">

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-4 w-full">
        <h1 className="font-['Be Vietnam Pro',_sans-serif] text-[24px] sm:text-[32px] lg:text-[40px] text-[#0D062D] font-semibold tracking-tight">
          Quản lý hồ sơ nhận nuôi
        </h1>
        <ApplicationFilterBar />
      </div>

      {isLoading && localItems.length === 0 ? (
        <div className="flex gap-[11px] w-full h-[500px] sm:h-[741px] overflow-x-auto">
          {KANBAN_COLUMNS.map((col) => (
            <div
              key={col.status}
              className="flex-[1_0_260px] h-full rounded-[18px] bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {/* 2. GẮN ref={scrollContainerRef} VÀO ĐÂY */}
          <div
            ref={scrollContainerRef}
            className="flex gap-[11px] overflow-x-auto pb-4 items-start scroll-smooth w-full custom-board-scroll"
          >
            {columns.map((col) => (
              <ApplicationColumn
                key={col.status}
                status={col.status}
                label={col.label}
                applications={col.applications}
                movingIds={movingIds}
                isDropTarget={overColumn === col.status && activeApp?.status !== col.status}
                onOpenDetail={(app) => setSelectedApp(app)}
                onOpenProfile={(app) => setProfileApp(app)}
                onRemove={(app) => console.log("Xoá ticket ID: ", app.id)}
                onOpenDocuments={(app) => setDocumentsApp(app)}
                onOpenQuickView={(app) => setQuickViewApp(app)}
              />
            ))}
          </div>

          <DragOverlay>
            {activeApp ? (
              <div className="bg-white border-[0.8px] border-[#D9D9D9] rounded-[14px] shadow-2xl w-[260px] p-[14px] rotate-[2deg] scale-[1.03] cursor-grabbing pointer-events-none">
                <ApplicationCardContent
                  application={activeApp}
                  onOpenProfile={() => { }}
                  onOpenDetail={() => { }}
                  onRemove={() => { }}
                  onOpenDocuments={() => { }}
                // Xoá dòng onOpenQuickView={...} đi vì thẻ Content không cần nữa
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {!isLoading && isScrollable && (
        <div className="flex justify-end w-full px-2 mt-[-8px] mb-2 animate-in fade-in duration-300">
          <p className="text-[12px] text-gray-500 flex items-center gap-1.5 italic">
            💡 Mẹo: Nhấn giữ
            <kbd className="font-sans font-bold border border-gray-200 rounded px-1.5 py-0.5 bg-gray-50 text-[10px] not-italic shadow-sm text-gray-700">
              Shift
            </kbd>
            + Cuộn chuột để lướt ngang
          </p>
        </div>
      )}

      {selectedApp && (
        <ApplicationDetailModal
          application={selectedApp}
          onClose={() => setSelectedApp(null)}
        />
      )}
      {profileApp && (
        <ApplicantProfileModal
          application={profileApp}
          onClose={() => setProfileApp(null)}
        />
      )}
      {documentsApp && (
        <AllDocumentsModal
          application={documentsApp}
          onClose={() => setDocumentsApp(null)}
        />
      )}
      {pendingApp && (
        <MoveToPendingModal
          application={pendingApp}
          onClose={() => setPendingApp(null)}
          onSubmit={async (data) => {
            // Khi bấm "Move to Pending" -> Chuyển thẻ sang cột PENDING
            await moveApplication(pendingApp.id, 'PENDING');
            setPendingApp(null);
          }}
        />
      )}
      {quickViewApp && (
        <ApplicationQuickViewModal
          application={quickViewApp}
          onClose={() => setQuickViewApp(null)}
        />
      )}
      {interviewApp && (
        <InterviewScheduleModal
          application={interviewApp}
          onClose={() => setInterviewApp(null)}
          onSubmit={async (data) => {
            // Khi người dùng bấm Đặt Lịch, gọi API để di chuyển thẻ
            await moveApplication(interviewApp.id, 'INTERVIEW_SCHEDULED');
            setInterviewApp(null);
          }}
        />
      )}
      {approveApp && (
        <ApproveApplicationModal
          application={approveApp}
          onClose={() => setApproveApp(null)}
          onSubmit={async (data) => {
            // Khi bấm Đã hoàn thành phỏng vấn / Move to Pending -> Chuyển thẻ sang cột APPROVED
            await moveApplication(approveApp.id, 'APPROVED');
            setApproveApp(null);
          }}
        />
      )}
      {needInfoApp && (
        <NeedMoreInfoModal
          application={needInfoApp}
          onClose={() => setNeedInfoApp(null)}
          onSubmit={async (data) => {
            // Khi bấm "Move to Pending" -> Chuyển thẻ sang cột NEED_MORE_INFO (hoặc gọi API tương ứng)
            await moveApplication(needInfoApp.id, 'NEED_MORE_INFO');
            setNeedInfoApp(null);
          }}
        />
      )}
      <style jsx>{`
        /* Style riêng cho thanh cuộn ngang của Kanban Board */
        .custom-board-scroll {
          scrollbar-width: thin;
          scrollbar-color: #E89B5A transparent;
        }
        .custom-board-scroll::-webkit-scrollbar {
          height: 8px; /* Độ dày vừa phải để dễ dùng chuột kéo */
        }
        .custom-board-scroll::-webkit-scrollbar-track {
          background: #F9FAFB; /* Nền xám thật nhạt */
          border-radius: 10px;
        }
        .custom-board-scroll::-webkit-scrollbar-thumb {
          background-color: #E89B5A; /* Màu cam thương hiệu */
          border-radius: 10px;
        }
        .custom-board-scroll::-webkit-scrollbar-thumb:hover {
          background-color: #D68B4E; /* Cam đậm hơn khi hover */
        }
      `}</style>
    </div>
  );
};