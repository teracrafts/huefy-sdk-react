import { createContext, useRef, useMemo, useContext, useState, useEffect, useCallback } from 'react';
import { HuefyClient } from '@teracrafts/huefy';
export { AuthenticationError, ErrorCode, HuefyError, InvalidRecipientError, InvalidTemplateDataError, NetworkError, ProviderError, RateLimitError, TemplateNotFoundError, TimeoutError, ValidationError, createErrorFromResponse, isErrorCode, isHuefyError, isRetryableError } from '@teracrafts/huefy';
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';

/* Huefy React SDK - https://huefy.com */

var HuefyContext = createContext(null);
function HuefyProvider({ config, children }) {
  const clientRef = useRef(null);
  const contextValue = useMemo(() => {
    if (!clientRef.current) {
      if (config.debug) {
        console.log("[Huefy] Creating new client with config:", {
          baseUrl: config.baseUrl,
          timeout: config.timeout,
          retryAttempts: config.retryAttempts
        });
      }
      clientRef.current = new HuefyClient(config, {
        onSendStart: config.debug ? (request) => {
          console.log("[Huefy] Starting email send:", request.template_key);
        } : void 0,
        onSendSuccess: config.debug ? (response) => {
          console.log("[Huefy] Email sent successfully:", response.message_id);
        } : void 0,
        onSendError: config.debug ? (error) => {
          console.error("[Huefy] Email send failed:", error.message);
        } : void 0,
        onRetry: config.debug ? (attempt, error) => {
          console.log(`[Huefy] Retry attempt ${attempt}:`, error.message);
        } : void 0
      });
    }
    return {
      client: clientRef.current,
      isReady: true,
      config
    };
  }, [config]);
  return /* @__PURE__ */ jsx(HuefyContext.Provider, { value: contextValue, children });
}
function useHuefyContext() {
  const context = useContext(HuefyContext);
  if (!context) {
    throw new Error(
      "useHuefyContext must be used within a HuefyProvider. Please wrap your component tree with <HuefyProvider>."
    );
  }
  return context;
}
function withHuefy(Component) {
  const WrappedComponent = (props) => {
    const { client, config } = useHuefyContext();
    return /* @__PURE__ */ jsx(
      Component,
      {
        ...props,
        huefyClient: client,
        huefyConfig: config
      }
    );
  };
  WrappedComponent.displayName = `withHuefy(${Component.displayName || Component.name})`;
  return WrappedComponent;
}
var initialState = {
  loading: false,
  error: null,
  data: null,
  success: false
};
function useHuefy(options = {}) {
  const { client } = useHuefyContext();
  const [state, setState] = useState(initialState);
  const optionsRef = useRef(options);
  const autoResetTimeoutRef = useRef(null);
  optionsRef.current = options;
  useEffect(() => {
    return () => {
      if (autoResetTimeoutRef.current) {
        clearTimeout(autoResetTimeoutRef.current);
      }
    };
  }, []);
  const reset = useCallback(() => {
    setState(initialState);
    if (autoResetTimeoutRef.current) {
      clearTimeout(autoResetTimeoutRef.current);
      autoResetTimeoutRef.current = null;
    }
  }, []);
  const setupAutoReset = useCallback(() => {
    const { autoResetDelay } = optionsRef.current;
    if (autoResetDelay && autoResetDelay > 0) {
      autoResetTimeoutRef.current = setTimeout(() => {
        reset();
      }, autoResetDelay);
    }
  }, [reset]);
  const sendEmail = useCallback(async (templateKey, data, recipient, emailOptions) => {
    const currentOptions = optionsRef.current;
    setState((prev) => ({ ...prev, loading: true, error: null, success: false }));
    currentOptions.onSending?.();
    try {
      const response = await client.sendEmail(templateKey, data, recipient, emailOptions);
      setState((prev) => ({
        ...prev,
        loading: false,
        data: response,
        success: true,
        error: null
      }));
      currentOptions.onSuccess?.(response);
      if (currentOptions.resetOnSuccess !== false) {
        if (currentOptions.autoResetDelay) {
          setupAutoReset();
        } else {
          setState(initialState);
        }
      }
      return response;
    } catch (error) {
      const huefyError = error;
      setState((prev) => ({
        ...prev,
        loading: false,
        error: huefyError,
        success: false
      }));
      currentOptions.onError?.(huefyError);
      if (currentOptions.resetOnError) {
        if (currentOptions.autoResetDelay) {
          setupAutoReset();
        } else {
          setState(initialState);
        }
      }
      throw huefyError;
    }
  }, [client, setupAutoReset]);
  const sendBulkEmails = useCallback(async (emails) => {
    const currentOptions = optionsRef.current;
    setState((prev) => ({ ...prev, loading: true, error: null, success: false }));
    currentOptions.onSending?.();
    try {
      const results = await client.sendBulkEmails(emails);
      setState((prev) => ({
        ...prev,
        loading: false,
        success: true,
        error: null
      }));
      const successfulResults = results.filter((r) => r.success && r.result);
      successfulResults.forEach((result) => {
        if (result.result) {
          currentOptions.onSuccess?.(result.result);
        }
      });
      const failedResults = results.filter((r) => !r.success && r.error);
      failedResults.forEach((result) => {
        if (result.error) {
          currentOptions.onError?.(result.error);
        }
      });
      if (currentOptions.resetOnSuccess !== false) {
        if (currentOptions.autoResetDelay) {
          setupAutoReset();
        } else {
          setState(initialState);
        }
      }
      return results;
    } catch (error) {
      const huefyError = error;
      setState((prev) => ({
        ...prev,
        loading: false,
        error: huefyError,
        success: false
      }));
      currentOptions.onError?.(huefyError);
      if (currentOptions.resetOnError) {
        if (currentOptions.autoResetDelay) {
          setupAutoReset();
        } else {
          setState(initialState);
        }
      }
      throw huefyError;
    }
  }, [client, setupAutoReset]);
  const healthCheck = useCallback(async () => {
    return client.healthCheck();
  }, [client]);
  return {
    ...state,
    sendEmail,
    sendBulkEmails,
    reset,
    healthCheck
  };
}
var defaultValidate = (formData) => {
  const errors = [];
  if (!formData.templateKey?.trim()) {
    errors.push("Template key is required");
  }
  if (!formData.recipient?.trim()) {
    errors.push("Recipient email is required");
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.recipient)) {
      errors.push("Invalid email address");
    }
  }
  if (!formData.data || Object.keys(formData.data).length === 0) {
    errors.push("Template data is required");
  }
  return errors.length > 0 ? errors : null;
};
function useEmailForm(options = {}) {
  const {
    defaultTemplate = "",
    defaultData = {},
    defaultRecipient = "",
    defaultProvider,
    validate = defaultValidate,
    ...huefyOptions
  } = options;
  const [formData, setFormDataState] = useState(() => ({
    templateKey: defaultTemplate,
    data: { ...defaultData },
    recipient: defaultRecipient,
    provider: defaultProvider
  }));
  const huefyResult = useHuefy(huefyOptions);
  const setFormData = useCallback((updates) => {
    setFormDataState((prev) => ({
      ...prev,
      ...updates,
      // Merge data objects if both exist
      ...updates.data && prev.data ? {
        data: { ...prev.data, ...updates.data }
      } : updates.data ? { data: updates.data } : {}
    }));
  }, []);
  const setTemplateData = useCallback((data) => {
    setFormDataState((prev) => ({
      ...prev,
      data: { ...prev.data, ...data }
    }));
  }, []);
  const validationErrors = useMemo(() => {
    return validate(formData) || [];
  }, [formData, validate]);
  const isValid = useMemo(() => {
    return validationErrors.length === 0;
  }, [validationErrors]);
  const sendEmail = useCallback(async () => {
    if (!isValid) {
      throw new Error("Form validation failed");
    }
    const emailOptions = {};
    if (formData.provider) {
      emailOptions.provider = formData.provider;
    }
    return huefyResult.sendEmail(
      formData.templateKey,
      formData.data,
      formData.recipient,
      emailOptions
    );
  }, [formData, isValid, huefyResult.sendEmail]);
  const reset = useCallback(() => {
    setFormDataState({
      templateKey: defaultTemplate,
      data: { ...defaultData },
      recipient: defaultRecipient,
      provider: defaultProvider
    });
    huefyResult.reset();
  }, [defaultTemplate, defaultData, defaultRecipient, defaultProvider, huefyResult.reset]);
  return {
    // Form state
    formData,
    setFormData,
    setTemplateData,
    validationErrors,
    isValid,
    // Email sending state from useHuefy
    loading: huefyResult.loading,
    error: huefyResult.error,
    data: huefyResult.data,
    success: huefyResult.success,
    // Actions
    sendEmail,
    reset
  };
}
function SendEmailButton({
  templateKey,
  data,
  recipient,
  provider,
  children = "Send Email",
  loadingText = "Sending...",
  onSuccess,
  onError,
  disabled = false,
  className = "",
  style,
  type = "button"
}) {
  const { sendEmail, loading } = useHuefy({
    onSuccess,
    onError
  });
  const handleClick = async () => {
    try {
      await sendEmail(templateKey, data, recipient, provider ? { provider } : void 0);
    } catch (error) {
    }
  };
  return /* @__PURE__ */ jsx(
    "button",
    {
      type,
      onClick: handleClick,
      disabled: disabled || loading,
      className,
      style,
      children: loading ? loadingText : children
    }
  );
}
function EmailForm({
  templateKey,
  initialData = {},
  initialRecipient = "",
  provider,
  onSuccess,
  onError,
  onSending,
  validate,
  className = "",
  showLoading = true,
  showMessages = true,
  loadingComponent: LoadingComponent,
  errorComponent: ErrorComponent,
  successComponent: SuccessComponent
}) {
  const {
    formData,
    setFormData,
    setTemplateData,
    sendEmail,
    loading,
    error,
    success,
    data,
    validationErrors,
    isValid,
    reset
  } = useEmailForm({
    defaultTemplate: templateKey,
    defaultData: initialData,
    defaultRecipient: initialRecipient,
    defaultProvider: provider,
    validate,
    onSuccess,
    onError,
    onSending
  });
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isValid && !loading) {
      try {
        await sendEmail();
      } catch (error2) {
      }
    }
  };
  const handleRecipientChange = (e) => {
    setFormData({ recipient: e.target.value });
  };
  const handleDataChange = (key, value) => {
    setTemplateData({ [key]: value });
  };
  if (success && showMessages) {
    if (SuccessComponent && data) {
      return /* @__PURE__ */ jsx(SuccessComponent, { response: data });
    }
    return /* @__PURE__ */ jsxs("div", { className: "huefy-success", style: { color: "green", padding: "16px" }, children: [
      "\u2705 Email sent successfully! Message ID: ",
      data?.messageId,
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: reset,
          style: { marginLeft: "16px", padding: "4px 8px" },
          children: "Send Another"
        }
      )
    ] });
  }
  return /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: `huefy-form ${className}`, children: [
    /* @__PURE__ */ jsxs("div", { className: "huefy-field", style: { marginBottom: "16px" }, children: [
      /* @__PURE__ */ jsx("label", { htmlFor: "recipient", style: { display: "block", marginBottom: "4px" }, children: "Recipient Email *" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          id: "recipient",
          type: "email",
          value: formData.recipient,
          onChange: handleRecipientChange,
          placeholder: "Enter recipient email",
          required: true,
          style: {
            width: "100%",
            padding: "8px",
            border: "1px solid #ccc",
            borderRadius: "4px"
          }
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "huefy-template-data", children: [
      /* @__PURE__ */ jsx("h4", { style: { marginBottom: "8px" }, children: "Template Data" }),
      Object.entries(formData.data).map(([key, value]) => /* @__PURE__ */ jsxs("div", { className: "huefy-field", style: { marginBottom: "12px" }, children: [
        /* @__PURE__ */ jsx("label", { htmlFor: key, style: { display: "block", marginBottom: "4px" }, children: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1") }),
        /* @__PURE__ */ jsx(
          "input",
          {
            id: key,
            type: "text",
            value,
            onChange: (e) => handleDataChange(key, e.target.value),
            placeholder: `Enter ${key}`,
            style: {
              width: "100%",
              padding: "8px",
              border: "1px solid #ccc",
              borderRadius: "4px"
            }
          }
        )
      ] }, key)),
      /* @__PURE__ */ jsx(
        AddFieldButton,
        {
          onAdd: (key) => setTemplateData({ [key]: "" }),
          existingKeys: Object.keys(formData.data)
        }
      )
    ] }),
    validationErrors.length > 0 && /* @__PURE__ */ jsxs("div", { className: "huefy-errors", style: {
      color: "red",
      marginBottom: "16px",
      padding: "8px",
      border: "1px solid red",
      borderRadius: "4px",
      backgroundColor: "#fee"
    }, children: [
      /* @__PURE__ */ jsx("strong", { children: "Please fix the following errors:" }),
      /* @__PURE__ */ jsx("ul", { style: { margin: "4px 0 0 20px" }, children: validationErrors.map((error2, index) => /* @__PURE__ */ jsx("li", { children: error2 }, index)) })
    ] }),
    error && showMessages && /* @__PURE__ */ jsx("div", { className: "huefy-error", style: {
      color: "red",
      marginBottom: "16px",
      padding: "8px",
      border: "1px solid red",
      borderRadius: "4px",
      backgroundColor: "#fee"
    }, children: ErrorComponent ? /* @__PURE__ */ jsx(ErrorComponent, { error }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("strong", { children: "Error:" }),
      " ",
      error.message,
      error.code && /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("small", { children: [
        "Code: ",
        error.code
      ] }) })
    ] }) }),
    loading && showLoading && /* @__PURE__ */ jsx("div", { className: "huefy-loading", style: {
      marginBottom: "16px",
      padding: "8px",
      border: "1px solid #ccc",
      borderRadius: "4px",
      backgroundColor: "#f9f9f9"
    }, children: LoadingComponent ? /* @__PURE__ */ jsx(LoadingComponent, {}) : "\u{1F4E7} Sending email..." }),
    /* @__PURE__ */ jsxs("div", { className: "huefy-actions", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          disabled: !isValid || loading,
          style: {
            padding: "12px 24px",
            backgroundColor: isValid && !loading ? "#007bff" : "#ccc",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isValid && !loading ? "pointer" : "not-allowed",
            marginRight: "8px"
          },
          children: loading ? "Sending..." : "Send Email"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: reset,
          disabled: loading,
          style: {
            padding: "12px 24px",
            backgroundColor: "transparent",
            color: "#6c757d",
            border: "1px solid #6c757d",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer"
          },
          children: "Reset"
        }
      )
    ] })
  ] });
}
function AddFieldButton({
  onAdd,
  existingKeys
}) {
  const [newKey, setNewKey] = useState("");
  const [showInput, setShowInput] = useState(false);
  const handleAdd = () => {
    if (newKey.trim() && !existingKeys.includes(newKey.trim())) {
      onAdd(newKey.trim());
      setNewKey("");
      setShowInput(false);
    }
  };
  const handleCancel = () => {
    setNewKey("");
    setShowInput(false);
  };
  if (!showInput) {
    return /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        onClick: () => setShowInput(true),
        style: {
          padding: "6px 12px",
          backgroundColor: "transparent",
          color: "#007bff",
          border: "1px dashed #007bff",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "14px"
        },
        children: "+ Add Field"
      }
    );
  }
  return /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: "8px", alignItems: "center" }, children: [
    /* @__PURE__ */ jsx(
      "input",
      {
        type: "text",
        value: newKey,
        onChange: (e) => setNewKey(e.target.value),
        placeholder: "Field name",
        onKeyDown: (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleAdd();
          } else if (e.key === "Escape") {
            handleCancel();
          }
        },
        style: {
          padding: "4px 8px",
          border: "1px solid #ccc",
          borderRadius: "4px",
          fontSize: "14px"
        },
        autoFocus: true
      }
    ),
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        onClick: handleAdd,
        disabled: !newKey.trim() || existingKeys.includes(newKey.trim()),
        style: {
          padding: "4px 8px",
          backgroundColor: "#28a745",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "12px"
        },
        children: "Add"
      }
    ),
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        onClick: handleCancel,
        style: {
          padding: "4px 8px",
          backgroundColor: "#6c757d",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "12px"
        },
        children: "Cancel"
      }
    )
  ] });
}
var VERSION = "1.0.0-beta.9";
var SDK_INFO = {
  name: "@teracrafts/huefy-react",
  version: VERSION,
  language: "React/TypeScript",
  baseSDK: "@teracrafts/huefy",
  repository: "https://github.com/teracrafts/huefy-sdk",
  documentation: "https://docs.huefy.com/sdk/react"
};

export { EmailForm, HuefyProvider, SDK_INFO, SendEmailButton, VERSION, useEmailForm, useHuefy, useHuefyContext, withHuefy };
//# sourceMappingURL=index.mjs.map
//# sourceMappingURL=index.mjs.map