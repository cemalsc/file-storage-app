"use client";

import { db, storage } from "@/firebase";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useState } from "react";
import DropzoneComponent from "react-dropzone";
import toast from "react-hot-toast";

function Dropzone() {
  const [loading, setLoading] = useState(false);
  const { user } = useUser();

  const onDrop = async (acceptedFiles: File[]) => {
    if (loading || !user) return;

    setLoading(true);
    const toastId = toast.loading("Uploading...");

    const docRef = await addDoc(collection(db, "users", user.id, "files"), {
      userId: user.id,
      filename: acceptedFiles[0].name,
      fullName: user.fullName,
      profileImg: user.imageUrl,
      timestamp: serverTimestamp(),
      type: acceptedFiles[0].type,
      size: acceptedFiles[0].size,
    });

    const imageRef = ref(storage, `users/${user.id}/files/${docRef.id}`);

    try {
      await uploadBytes(imageRef, acceptedFiles[0]);

      const downloadURL = await getDownloadURL(imageRef);

      await updateDoc(doc(db, "users", user.id, "files", docRef.id), {
        downloadURL,
      });

      toast.success("Uploaded Successfully", { id: toastId });
    } catch (error) {
      toast.error("Error uploading file", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // max file size 20MB
  const maxFileSize = 20971520;

  return (
    <DropzoneComponent minSize={0} maxSize={maxFileSize} onDrop={onDrop}>
      {({ getRootProps, getInputProps, isDragActive, isDragReject, fileRejections }) => {
        const isFileTooLarge = fileRejections.length > 0 && fileRejections[0].file.size > maxFileSize;

        return (
          <section className="m-4">
            <div
              {...getRootProps()}
              className={cn(
                "w-full h-52 flex justify-center items-center p-5 border border-dashed rounded-lg text-center",
                isDragActive
                  ? "bg-[#035FFE]  text-white animate-pulse"
                  : "bg-slate-100/50 dark:bg-slate-800/80 text-slate-400"
              )}
            >
              <input {...getInputProps()} />
              {!isDragActive && "Click here or drop a file to upload"}
              {isDragActive && !isDragReject && "Drop to upload this file"}
              {isDragReject && "File type not accepted"}
              {isFileTooLarge && <div className="text-danger mt-2">File is too large.</div>}
            </div>
          </section>
        );
      }}
    </DropzoneComponent>
  );
}

export default Dropzone;
