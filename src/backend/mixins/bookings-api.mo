import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";
import Types "../types/bookings";
import BookingsLib "../lib/bookings";

mixin (
  bookings : Map.Map<Types.BookingId, Types.BookingRequest>,
  nextBookingId : { var value : Nat },
  accessControlState : AccessControl.AccessControlState,
) {
  public shared ({ caller }) func createBooking(input : Types.BookingInput) : async Types.BookingRequest {
    if (caller.isAnonymous()) {
      Runtime.trap("Harus masuk untuk mengirim permintaan sewa");
    };
    BookingsLib.createBooking(bookings, nextBookingId, input, Time.now());
  };

  public shared ({ caller }) func listBookings(status : ?Types.BookingStatus) : async [Types.BookingRequest] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Hanya admin yang dapat melihat daftar permintaan sewa");
    };
    BookingsLib.listBookings(bookings, status);
  };

  public shared ({ caller }) func updateBookingStatus(id : Types.BookingId, status : Types.BookingStatus) : async ?Types.BookingRequest {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Hanya admin yang dapat mengubah status permintaan sewa");
    };
    BookingsLib.updateBookingStatus(bookings, id, status);
  };
};
