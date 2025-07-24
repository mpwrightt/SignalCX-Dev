import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export function AdvancedAnalyticsModal({ modalOpen, setModalOpen, modalContent }: any) {
  return (
    <Dialog open={modalOpen} onOpenChange={setModalOpen}>
      <DialogContent className="animate-fade-in-up max-w-4xl max-h-[80vh] overflow-y-auto">
        {modalContent}
      </DialogContent>
    </Dialog>
  );
} 