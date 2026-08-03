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

const isColumnId = (id: string | number) =>
  KANBAN_COLUMNS.some((c) => c.status === id);

export const ApplicationKanbanBoard: React.FC = () => {
  const { items, isLoading, movingIds } = useApplicationList();
  const { fetchApplications, moveApplication } = useApplicationActions();

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
          // Đo lại rect liên tục trong lúc kéo (không chỉ 1 lần lúc dragStart).
          // Quan trọng vì cột giờ có thể scroll nội bộ -> vị trí/khả năng hiển
          // thị của card bên trong có thể đổi trong lúc đang kéo.
          measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
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