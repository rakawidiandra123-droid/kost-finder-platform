import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Types "../types/bookings";

module {
  public type BookingRequest = Types.BookingRequest;
  public type BookingId = Types.BookingId;
  public type BookingStatus = Types.BookingStatus;
  public type BookingInput = Types.BookingInput;

  public func createBooking(
    bookings : Map.Map<BookingId, BookingRequest>,
    nextId : { var value : Nat },
    input : BookingInput,
    now : Types.Timestamp,
  ) : BookingRequest {
    let id = nextId.value;
    nextId.value := id + 1;
    let booking : BookingRequest = {
      id;
      applicantName = input.applicantName;
      phone = input.phone;
      email = input.email;
      moveInDate = input.moveInDate;
      message = input.message;
      roomId = input.roomId;
      status = #pending;
      createdAt = now;
    };
    bookings.add(id, booking);
    booking;
  };

  public func listBookings(
    bookings : Map.Map<BookingId, BookingRequest>,
    status : ?BookingStatus,
  ) : [BookingRequest] {
    let all = bookings.values().toArray();
    switch (status) {
      case null { all };
      case (?s) { all.filter(func booking = booking.status == s) };
    };
  };

  public func updateBookingStatus(
    bookings : Map.Map<BookingId, BookingRequest>,
    id : BookingId,
    status : BookingStatus,
  ) : ?BookingRequest {
    switch (bookings.get(id)) {
      case null { null };
      case (?booking) {
        let updated : BookingRequest = {
          id = booking.id;
          applicantName = booking.applicantName;
          phone = booking.phone;
          email = booking.email;
          moveInDate = booking.moveInDate;
          message = booking.message;
          roomId = booking.roomId;
          status;
          createdAt = booking.createdAt;
        };
        bookings.add(id, updated);
        ?updated;
      };
    };
  };
};
