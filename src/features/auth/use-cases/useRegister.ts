import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { getErrorMessage } from "@/lib/utils/api";
import { RegisterFormDataSchema, type RegisterFormData } from "../types/auth.types";
import { useAuthRegister } from "@/lib/api/hooks/auth.hooks";
import { useMediaCompletePublicUpload, useMediaInitPublicUpload } from "@/lib/api/hooks/media.hooks";
import type {
  PresignedUploadInitRequest,
  RegisterRequest,
} from "@/lib/api/types";
import type { Role } from "@/lib/api/types";

export function useRegister() {
  const navigate = useNavigate();
  const registerMutation = useAuthRegister();
  const initPublicUploadMutation = useMediaInitPublicUpload();
  const completePublicUploadMutation = useMediaCompletePublicUpload();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(RegisterFormDataSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      displayName: "",
      phone: "",
      role: "STUDENT",
      gender: undefined,
      consent: false,
      personalDocuments: [],
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    const personalDocs = data.personalDocuments || [];

    try {
      const verification_media_asset_ids: string[] = [];

      for (const file of personalDocs) {
        const initRequest: PresignedUploadInitRequest = {
          filename: file.name,
          content_type: file.type || "application/octet-stream",
          size_bytes: file.size,
          access: "public" as 'public' | 'private',
          purpose: "kyc" as 'post' | 'comment' | 'avatar' | 'background' | 'kyc',
        };

        const initRes = await initPublicUploadMutation.mutateAsync(initRequest);
        const initData = initRes;

        const uploadUrl = initData.upload_url;
        const uploadMethod = initData.method;
        const uploadHeaders = initData.headers;
        const uploadId = initData.upload_id;
        const assetId = initData.asset_id;

        if (!uploadUrl || !uploadId || !assetId) {
          throw new Error("Media upload init failed");
        }

        const headers = new Headers();
        for (const h of uploadHeaders) {
          if (h?.name) headers.set(h.name, h.value);
        }

        const uploadResponse = await fetch(uploadUrl, {
          method: uploadMethod || "PUT",
          headers,
          body: file,
        });

        if (!uploadResponse.ok) {
          throw new Error("Media upload failed");
        }

        const etag = uploadResponse.headers.get("etag") ?? undefined;

        await completePublicUploadMutation.mutateAsync({
          uploadId,
          data: {
            etag: etag?.replace(/"/g, ""),
            size_bytes: file.size,
          },
        });

        verification_media_asset_ids.push(assetId);
      }

      const registerData: RegisterRequest = {
        email: data.email,
        password: data.password,
        display_name: data.displayName,
        role: data.role as Role,
        gender: data.gender || "",
        consent: data.consent,
        phone: data.phone,
        ...(verification_media_asset_ids.length > 0 ? { verification_media_asset_ids } : {}),
      };

      const response = await registerMutation.mutateAsync(registerData);
      const user_id = response.id;

      sessionStorage.setItem("otp_verify_email", data.email);
      sessionStorage.setItem("otp_verify_user_id", user_id);

      navigate("/verify-otp", {
        state: { email: data.email, user_id },
        replace: true,
      });
    } catch (error) {
      console.error("Registration error:", error);
    }
  };

  return {
    form,
    onSubmit,
    error: getErrorMessage(registerMutation.error),
    isSuccess: !registerMutation.error && !registerMutation.isPending && form.formState.isSubmitSuccessful,
    isLoading: registerMutation.isPending || initPublicUploadMutation.isPending || completePublicUploadMutation.isPending,
  };
}
