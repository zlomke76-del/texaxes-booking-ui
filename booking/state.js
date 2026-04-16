export const PUBLIC_MAX_PARTY_SIZE = 24;

export const bookingState = {
  modal: null,
  isOpen: false,
  isSubmitting: false,
  availabilityLoading: false,
  step: 1,
  availability: [],
  selectedSlot: null,
  values: {
    experience: "axe_throwing",
    throwers: 4,
    duration_hours: 1,
    date: "",
    addons: {
      byob_guests: 0,
      wktl_knife_rental_qty: 0,
      pro_axe_qty: 0,
      big_axe_qty: 0,
      shovel_qty: 0
    },
    customer: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      birth_date: "",
      is_minor: false,
      notes: "",
      marketing_opt_in: false
    }
  }
};
