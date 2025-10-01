import { sendPasswordResetEmail, confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from './firebase';
import { resetLoginAttempts } from './loginAttemptService';

interface PasswordResetResult {
  success: boolean;
  message: string;
}

/**
 * Send password reset email to the user's Gmail
 */
export const sendPasswordReset = async (email: string): Promise<PasswordResetResult> => {
  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        success: false,
        message: 'กรุณากรอกอีเมลที่ถูกต้อง'
      };
    }

    // Check if it's a Gmail address (optional - you can remove this if you want to support all email providers)
    const isGmail = email.toLowerCase().includes('@gmail.com');
    if (!isGmail) {
      console.warn('Password reset sent to non-Gmail address:', email);
    }

    // Send password reset email using Firebase Auth
    await sendPasswordResetEmail(auth, email);

    // Reset login attempts since user is trying to recover password
    await resetLoginAttempts(email);

    console.log('Password reset email sent successfully to:', email);

    return {
      success: true,
      message: isGmail 
        ? `ส่งลิงก์รีเซ็ตรหัสผ่านไปยัง Gmail ของคุณแล้ว กรุณาตรวจสอบกล่องจดหมาย`
        : `ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว กรุณาตรวจสอบกล่องจดหมาย`
    };
  } catch (error: any) {
    console.error('Password reset error:', error);
    
    // Handle specific Firebase auth errors
    switch (error.code) {
      case 'auth/user-not-found':
        return {
          success: false,
          message: 'ไม่พบบัญชีผู้ใช้ที่ใช้อีเมลนี้'
        };
      case 'auth/invalid-email':
        return {
          success: false,
          message: 'รูปแบบอีเมลไม่ถูกต้อง'
        };
      case 'auth/unauthorized-continue-url':
        return {
          success: false,
          message: 'เกิดข้อผิดพลาดในการกำหนดค่า กรุณาติดต่อผู้ดูแลระบบ '
        };
      case 'auth/too-many-requests':
        return {
          success: false,
          message: 'ส่งคำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่ '
        };
      case 'auth/network-request-failed':
        return {
          success: false,
          message: 'ไม่สามารถเชื่อมต่ออินเทอร์เน็ต กรุณาตรวจสอบการเชื่อมต่อ '
        };
      default:
        return {
          success: false,
          message: 'เกิดข้อผิดพลาดในการส่งอีเมลรีเซ็ตรหัสผ่าน กรุณาลองใหม่ '
        };
    }
  }
};

/**
 * Verify password reset code (optional - for custom reset flow)
 */
export const verifyResetCode = async (code: string): Promise<PasswordResetResult & { email?: string }> => {
  try {
    const email = await verifyPasswordResetCode(auth, code);
    return {
      success: true,
      message: 'รหัสรีเซ็ตรหัสผ่านถูกต้อง ',
      email
    };
  } catch (error: any) {
    console.error('Password reset code verification error:', error);
    
    switch (error.code) {
      case 'auth/expired-action-code':
        return {
          success: false,
          message: 'รหัสรีเซ็ตรหัสผ่านหมดอายุแล้ว กรุณาขอรหัสใหม่ '
        };
      case 'auth/invalid-action-code':
        return {
          success: false,
          message: 'รหัสรีเซ็ตรหัสผ่านไม่ถูกต้อง '
        };
      case 'auth/user-disabled':
        return {
          success: false,
          message: 'บัญชีผู้ใช้ถูกปิดใช้งาน '
        };
      default:
        return {
          success: false,
          message: 'เกิดข้อผิดพลาดในการตรวจสอบรหัสรีเซ็ต '
        };
    }
  }
};

/**
 * Confirm password reset with new password (optional - for custom reset flow)
 */
export const confirmPasswordResetWithCode = async (code: string, newPassword: string): Promise<PasswordResetResult> => {
  try {
    // Validate password strength
    if (newPassword.length < 6) {
      return {
        success: false,
        message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร '
      };
    }

    await confirmPasswordReset(auth, code, newPassword);
    
    return {
      success: true,
      message: 'เปลี่ยนรหัสผ่านสำเร็จ กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่ '
    };
  } catch (error: any) {
    console.error('Password reset confirmation error:', error);
    
    switch (error.code) {
      case 'auth/expired-action-code':
        return {
          success: false,
          message: 'รหัสรีเซ็ตรหัสผ่านหมดอายุแล้ว กรุณาขอรหัสใหม่ '
        };
      case 'auth/invalid-action-code':
        return {
          success: false,
          message: 'รหัสรีเซ็ตรหัสผ่านไม่ถูกต้อง '
        };
      case 'auth/weak-password':
        return {
          success: false,
          message: 'รหัสผ่านไม่ปลอดภัยเพียงพอ กรุณาใช้รหัสผ่านที่แข็งแกร่งกว่า '
        };
      default:
        return {
          success: false,
          message: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน กรุณาลองใหม่ '
        };
    }
  }
};

/**
 * Validate email format and check if it's Gmail (optional check)
 */
export const validateEmailForReset = (email: string): { isValid: boolean; isGmail: boolean; message?: string } => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email);
  const isGmail = email.toLowerCase().includes('@gmail.com');
  
  if (!isValid) {
    return {
      isValid: false,
      isGmail: false,
      message: 'กรุณากรอกอีเมลที่ถูกต้อง '
    };
  }
  
  return {
    isValid: true,
    isGmail,
    message: isGmail 
      ? 'อีเมล Gmail ถูกต้อง '
      : 'อีเมลถูกต้อง (แนะนำให้ใช้ Gmail) '
  };
};

export type { PasswordResetResult };