export async function startTicketCheckout(_eventId: string): Promise<{ hasTicket: boolean }> {
  throw new Error("Paid ticket checkout is only available in the native mobile app.");
}
