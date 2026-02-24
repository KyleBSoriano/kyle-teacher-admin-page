import { useAppContext } from "@/context/AppContext";
import { Class } from "@/types";
import ClassForm from "@/components/ClassForm";
import { useParams, Navigate } from "react-router-dom";

const EditClassPage = () => {
  const { classes, updateClass } = useAppContext();
  const { id } = useParams<{ id: string }>();
  
  const classToEdit = classes.find(cls => cls.id === id);
  
  if (!classToEdit) {
    return <Navigate to="/classes" replace />;
  }
  
  const handleSubmit = async (formData: Omit<Class, "id">) => {
    try {
      await updateClass(id!, {
        period: formData.period,
        subject: formData.subject,
        description: formData.description,
        startTime: formData.startTime,
        endTime: formData.endTime,
        students: formData.students,
        allowedApps: formData.allowedApps,
      });
    } catch (error) {
      console.error('Error updating class:', error);
      // Error is already handled by updateClass
    }
  };
  
  return (
    <ClassForm 
      initialData={classToEdit} 
      onSubmit={handleSubmit} 
      isEditing={true} 
    />
  );
};

export default EditClassPage;