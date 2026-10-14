import Common "../types/common";

module {
  public type BookingId = Common.BookingId;
  public type RoomId = Common.RoomId;
  public type Timestamp = Common.Timestamp;

  public type BookingStatus = {
    #pending;
    #approved;
    #rejected;
  };

  public type BookingRequest = {
    id : BookingId;
    applicantName : Text;
    phone : Text;
    email : Text;
    moveInDate : Text;
    message : Text;
    roomId : RoomId;
    status : BookingStatus;
    createdAt : Timestamp;
  };

  public type BookingInput = {
    applicantName : Text;
    phone : Text;
    email : Text;
    moveInDate : Text;
    message : Text;
    roomId : RoomId;
  };
};
