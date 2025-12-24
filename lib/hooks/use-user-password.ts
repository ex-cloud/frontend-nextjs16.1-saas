import { useMutation } from '@tanstack/react-query'
import { userService } from '@/lib/api/services/user.service'
import { ChangePasswordInput } from '@/types/user'
import { toast } from 'sonner'

interface UseChangePasswordOptions {
  onSuccess?: () => void
  onError?: (error: unknown) => void
}

export function useChangePassword(options?: UseChangePasswordOptions) {

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: ChangePasswordInput }) =>
      userService.changePassword(userId, data),
    onSuccess: () => {
      toast.success('Password updated successfully')
      options?.onSuccess?.()
    },
    onError: (error: unknown) => {
      // Extract error message from Laravel response
      let message = "Failed to update password";
      let errors: Record<string, string[]> | undefined;

      if (
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "data" in error.response &&
        error.response.data &&
        typeof error.response.data === "object"
      ) {
        const data = error.response.data as {
          message?: string;
          errors?: Record<string, string[]>;
        };
        message = data.message || message;
        errors = data.errors;
      } else if (error instanceof Error) {
        message = error.message;
      }

      // Show specific field errors if available
      if (errors?.current_password) {
        toast.error(errors.current_password[0]);
      } else if (errors?.new_password) {
        toast.error(errors.new_password[0]);
      } else {
        toast.error(message);
      }

      options?.onError?.(error);
    },
  })
}
