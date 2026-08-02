'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { KANBAN_COLUMNS, ApplicationStatus, AdoptionApplication } from '@/types/application';
import { useApplicationList, useApplicationActions } from '@/stores/useApplicationStore';
import { ApplicationColumn } from './components/ApplicationColumn';
import { ApplicationCard, ApplicationCardContent } from './components/ApplicationCard';
import { ApplicationDetailModal } from './components/ApplicationDetailModal';
import { ApplicationFilterBar } from './components/ApplicationFilterBar';
import { ApplicantProfileModal } from '@/components/ApplicantProfileModal';

export const ApplicationKanbanBoard: React.FC = () => {
  const { items, isLoading, movingIds } = useApplicationList();
  const { fetchApplications, moveApplication } = useApplicationActions();

  const [activeApp, setActiveApp] = useState<AdoptionApplication | null>(null);
  const [selectedApp, setSelectedApp] = useState<AdoptionApplication | null>(null);
  const [openRejectFormOnSelect, setOpenRejectFormOnSelect] = useState(false);
  const [overColumn, setOverColumn] = useState<ApplicationStatus | null>(null);
  const [profileApp, setProfileApp] = useState<AdoptionApplication | null>(null);

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
        applications: items.filter((a) => a.status === col.status),
      })),
    [items]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const app = items.find((a) => a.id === event.active.id);
    setActiveApp(app ?? null);
  };

  const handleDragOver = (event: any) => {
    const overId = event.over?.id as ApplicationStatus | undefined;
    setOverColumn(overId ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveApp(null);
    setOverColumn(null);
    if (!over) return;

    const app = items.find((a) => a.id === active.id);
    const nextStatus = over.id as ApplicationStatus;
    if (!app || app.status === nextStatus) return;

    if (REQUIRES_CONFIRM.includes(nextStatus)) {
      setOpenRejectFormOnSelect(true);
      setSelectedApp(app);
      return;
    }

    moveApplication(app.id, nextStatus);
  };

  return (
    <div className="flex flex-col justify-start items-start gap-[40px] w-full max-w-[1318px]">
      {/* Header đồng bộ UI mẫu */}
      <div className="flex justify-start items-center w-full h-[48px]">
        <div className="flex justify-center items-center h-[43px]">
          <h1 className="font-['Urbanist',_sans-serif] text-[40px] whitespace-nowrap text-[#0D062D] leading-none capitalize font-semibold">
            Quản lý Đơn Nhận Nuôi
          </h1>
        </div>

        {/* Tích hợp Component ApplicationFilterBar của bạn vào style mới */}
        <div className="ml-auto flex items-center gap-[12px]">
          <ApplicationFilterBar />
        </div>
      </div>

      {isLoading && items.length === 0 ? (
        <div className="flex gap-[11px] w-full h-[741px]">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-[254px] h-full rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {/* Vùng chứa Columns - Giữ đúng width/gap của mẫu */}
          <div className="flex gap-[11px] overflow-x-auto pb-4 items-stretch scroll-smooth w-full min-h-[741px]">
            {columns.map((col) => (
              <ApplicationColumn
                key={col.status}
                status={col.status}
                label={col.label}
                applications={col.applications}
                movingIds={movingIds}
                isDropTarget={overColumn === col.status && activeApp?.status !== col.status}
                // Khi click vào Thẻ -> Mở Modal Duyệt Đơn
                onCardClick={(app) => {
                  setOpenRejectFormOnSelect(false);
                  setSelectedApp(app);
                }}
                // Khi click vào Tên -> Mở Modal User Profile
                onNameClick={(app) => {
                  setProfileApp(app);
                }}
              />
            ))}
          </div>

          {/* Hiệu ứng khi kéo thẻ */}
          <DragOverlay>
            {activeApp ? (
              <div className="bg-white border-[0.8px] border-[#D9D9D9] rounded-[14px] shadow-2xl w-[246px] rotate-[2deg] scale-[1.03] cursor-grabbing">
                {/* Truyền vào overlay để tránh bị lỗi undefined props */}
                <ApplicationCardContent application={activeApp} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {selectedApp && (
        <ApplicationDetailModal
          application={selectedApp}
          initialShowRejectForm={openRejectFormOnSelect}
          onClose={() => setSelectedApp(null)}
        />
      )}

      {/* Modal Hồ Sơ Người Dùng Mới (ApplicantProfileModal) */}
      {profileApp && (
        <ApplicantProfileModal
          application={profileApp}
          onClose={() => setProfileApp(null)}
        />
      )}
    </div>
  );
};