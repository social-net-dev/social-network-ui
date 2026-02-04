/**
 * Manual API definitions for endpoints missing from OpenAPI spec
 * Follows the same pattern as generated code using customInstance
 */
import { customInstance } from '../axios-instance';

/**
 * Change user password
 * POST /auth/change-password
 */
export const changePassword = (currentPassword: string, newPassword: string) => {
  const formData = new FormData();
  formData.append("current_password", currentPassword);
  formData.append("new_password", newPassword);

  return customInstance<{ message: string }>({
    url: "/auth/change-password",
    method: "POST",
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

/**
 * Self Deactivate with password
 * POST /users/me/deactivate
 * (Note: Generated version lacks password field)
 */
export const deactivateAccount = (password: string) => {
  const formData = new FormData();
  formData.append("password", password);
  
  return customInstance<{ message?: string }>({
    url: "/users/me/deactivate",
    method: "POST",
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};
