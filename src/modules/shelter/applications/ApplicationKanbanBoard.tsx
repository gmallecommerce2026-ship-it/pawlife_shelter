'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
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

export const ApplicationKanbanBoard: React.FC = () => {
  const { items, isLoading, movingIds } = useApplicationList();
  const { fetchApplications, moveApplication } = useApplicationActions();

  // State cục bộ dùng để hiển thị preview (reorder/đổi cột) mượt trong lúc kéo,
  // trước khi commit thật sự lên store lúc thả (dragEnd). Đồng bộ lại từ `items`
  // (nguồn sự thật từ store) mỗi khi nó thay đổi, TRỪ lúc đang kéo (xem isDraggingRef).
  const [localItems, setLocalItems] = useState<AdoptionApplication[]>(items);
  const isDraggingRef = useRef(false);

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

  const columns = useMemo(
    () =>
      KANBAN_COLUMNS.map((col) => ({
        ...col,
        applications: localItems.filter((a) => a.status === col.status),
      })),
    [localItems]
  );

  const handleDragStart = (event: DragStartEvent) => {
    isDraggingRef.current = true;
    const app = localItems.find((a) => a.id === event.active.id);
    setActiveApp(app ?? null);
  };

  // Chạy liên tục trong lúc kéo (hover qua card khác hoặc qua cột khác):
  // reorder `localItems` ngay lập tức để các card còn lại tự "né" (useSortable
  // ở ApplicationCard sẽ tự animate transform khi vị trí trong mảng đổi).
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

    // over.id là 1 trong 2 trường hợp: id của cột (khi thả vào vùng trống của cột),
    // hoặc id của 1 card khác (khi hover ngay trên/dưới card đó).
    const overIsColumn = KANBAN_COLUMNS.some((c) => c.status === overId);
    const overItem = localItems.find((a) => a.id === overId);
    const targetStatus = overIsColumn ? (overId as ApplicationStatus) : overItem?.status;
    if (!targetStatus) return;

    setOverColumn(targetStatus);

    setLocalItems((prev) => {
      const oldIndex = prev.findIndex((a) => a.id === activeId);
      if (oldIndex === -1) return prev;

      // Cùng cột + đang hover trên 1 card khác -> chỉ đổi vị trí (dodge tại chỗ)
      if (activeItem.status === targetStatus && !overIsColumn && overItem) {
        const newIndex = prev.findIndex((a) => a.id === overId);
        if (newIndex === -1 || newIndex === oldIndex) return prev;
        return arrayMove(prev, oldIndex, newIndex);
      }

      // Khác cột -> cập nhật status để "chuyển nhà", đồng thời chèn gần vị trí
      // đang hover (nếu hover trên 1 card cụ thể) để card khác trong cột đích
      // tự né ra đúng chỗ.
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
      // Thả ra ngoài / không xác định được -> khôi phục lại đúng trạng thái từ store
      setLocalItems(items);
      return;
    }

    const finalItem = localItems.find((a) => a.id === activeId);
    if (!finalItem || finalItem.status === originalItem.status) return;

    if (REQUIRES_CONFIRM.includes(finalItem.status)) {
      // Cần xác nhận trước khi đóng hồ sơ -> chưa commit, trả preview về vị trí cũ
      setLocalItems((prev) =>
        prev.map((a) => (a.id === activeId ? { ...a, status: originalItem.status } : a))
      );
      setSelectedApp(originalItem);
      return;
    }

    moveApplication(activeId, finalItem.status);
  };

  return (
    // Tăng max-w lên 1536px (2xl) hoặc full để 5 cột có không gian thở, hoặc bạn giữ 1318px tùy thiết kế
    <div className="flex flex-col justify-start gap-6 sm:gap-[40px] w-full overflow-hidden">

      {/* --- HEADER --- */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-4 w-full">
        <h1 className="font-['Be Vietnam Pro',_sans-serif] text-[24px] sm:text-[32px] lg:text-[40px] text-[#0D062D] font-semibold tracking-tight">
          Quản lý hồ sơ nhận nuôi
        </h1>
        <ApplicationFilterBar />
      </div>
      {/* -------------- */}

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
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {/* Vùng chứa Columns.
              items-start (thay vì items-stretch cũ): để mỗi cột giữ chiều cao
              riêng theo nội dung của nó, không bị kéo giãn bằng cột cao nhất. */}
          <div className="flex gap-[11px] overflow-x-auto pb-4 items-start scroll-smooth w-full">
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
              />
            ))}
          </div>

          {/* Hiệu ứng khi kéo thẻ */}
          <DragOverlay>
            {activeApp ? (
              <div className="bg-white border-[0.8px] border-[#D9D9D9] rounded-[14px] shadow-2xl w-[260px] p-[14px] rotate-[2deg] scale-[1.03] cursor-grabbing pointer-events-none">
                <ApplicationCardContent
                  application={activeApp}
                  onOpenProfile={() => { }} 
                  onOpenDetail={() => { }}  
                  onRemove={() => { }}      
                  onOpenDocuments={() => { }} 
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Modals */}
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
    </div>
  );
};