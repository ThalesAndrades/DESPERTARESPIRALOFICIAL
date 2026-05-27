/**
 * Eventos canônicos — fonte única da verdade para nomes de eventos
 * disparados no app. Mantém type-safety nos chamadores.
 */
export const Events = {
  PageView:        "page_view",
  ViewContent:     "view_content",
  ViewModule:      "view_module",
  StartQuiz:       "start_quiz",
  CompleteQuiz:    "complete_quiz",
  ClickCTA:        "click_cta",
  OpenWaitlist:    "open_waitlist",
  JoinWaitlist:    "join_waitlist",
  Subscribe:       "subscribe",
  GenerateLead:    "generate_lead",
  ScrollDepth:     "scroll_depth",
  OutboundClick:   "outbound_click",
  ToggleTheme:     "toggle_theme",
  AdminUnlock:     "admin_unlock_attempt",
  FormError:       "form_error",
  Search:          "search",
  BeginCheckout:   "begin_checkout",
  AddPaymentInfo:  "add_payment_info",
  Purchase:        "purchase",
  Contact:         "contact",
} as const;

export type EventName = (typeof Events)[keyof typeof Events];
