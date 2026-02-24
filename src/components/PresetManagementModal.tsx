import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Calendar, Clock } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Preset {
  id: string;
  name: string;
  description?: string;
  schedule_blocks: any[];
}

interface PresetManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  presets: Preset[];
  onDeletePreset: (presetId: string, presetName: string) => void;
  onApplyPreset?: (presetName: string) => void;
}

const PresetManagementModal: React.FC<PresetManagementModalProps> = ({
  isOpen,
  onClose,
  presets,
  onDeletePreset,
  onApplyPreset
}) => {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [presetToDelete, setPresetToDelete] = useState<{ id: string; name: string } | null>(null);

  const handleDeleteClick = (id: string, name: string) => {
    setPresetToDelete({ id, name });
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (presetToDelete) {
      onDeletePreset(presetToDelete.id, presetToDelete.name);
      setDeleteConfirmOpen(false);
      setPresetToDelete(null);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[85vh] p-0 gap-0">
          {/* Navy Header */}
          <div className="bg-[#012D68] rounded-t-lg p-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white mb-2">
                Manage Schedule Presets
              </DialogTitle>
              <DialogDescription className="text-gray-200 text-base">
                View, apply, or delete your saved schedule presets
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Content */}
          <div className="p-6">
            <ScrollArea className="h-[500px] pr-4">
              {presets.length === 0 ? (
                <div className="text-center py-16">
                  <Calendar className="w-20 h-20 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-600 text-lg font-medium mb-2">No presets saved yet</p>
                  <p className="text-gray-500 text-sm">
                    Create a schedule and save it as a preset to reuse it later
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {presets.map((preset) => (
                    <div
                      key={preset.id}
                      className="border-2 border-gray-200 rounded-lg p-5 hover:border-[#012D68] hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-xl text-[#012D68] mb-1">
                            {preset.name}
                          </h3>
                          {preset.description && (
                            <p className="text-sm text-gray-600">
                              {preset.description}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(preset.id, preset.name)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 -mt-1"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>

                      <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-100">
                        <div className="flex items-center gap-2 text-sm text-[#012D68] font-semibold mb-3">
                          <Clock className="w-4 h-4" />
                          <span>
                            {preset.schedule_blocks.length} time block{preset.schedule_blocks.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {preset.schedule_blocks.map((block: any, index: number) => (
                            <div key={index} className="text-sm text-gray-700 flex justify-between items-center bg-white rounded px-3 py-2">
                              <span className="font-semibold text-[#012D68]">{block.period}</span>
                              <span className="text-gray-600">{block.start_time} - {block.end_time}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {onApplyPreset && (
                        <Button
                          onClick={() => {
                            onApplyPreset(preset.name);
                            onClose();
                          }}
                          className="w-full bg-[#012D68] hover:bg-[#011f4a] text-white font-semibold py-6 text-base shadow-md hover:shadow-lg transition-all duration-200"
                        >
                          Apply to Selected Day
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-[#012D68]">Delete Preset?</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Are you sure you want to delete "<span className="font-semibold text-[#012D68]">{presetToDelete?.name}</span>"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-medium">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 font-semibold"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PresetManagementModal;
