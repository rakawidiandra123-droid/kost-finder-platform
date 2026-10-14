import Map "mo:core/Map";
import AccessControl "mo:caffeineai-authorization/access-control";

module {
  type RoomType = { #putra; #putri; #campur };
  type RoomStatus = { #available; #occupied };
  type Room = {
    id : Nat;
    name : Text;
    roomType : RoomType;
    monthlyPrice : Nat;
    description : Text;
    facilities : [Text];
    status : RoomStatus;
    photos : [Blob];
  };

  type BookingStatus = { #pending; #approved; #rejected };
  type BookingRequest = {
    id : Nat;
    applicantName : Text;
    phone : Text;
    email : Text;
    moveInDate : Text;
    message : Text;
    roomId : Nat;
    status : BookingStatus;
    createdAt : Int;
  };

  public type OldActor = {};

  public type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    rooms : Map.Map<Nat, Room>;
    bookings : Map.Map<Nat, BookingRequest>;
    nextRoomId : { var value : Nat };
    nextBookingId : { var value : Nat };
  };

  public func migration(_ : OldActor) : NewActor {
    {
      accessControlState = AccessControl.initState();
      rooms = Map.empty();
      bookings = Map.empty();
      nextRoomId = { var value = 0 };
      nextBookingId = { var value = 0 };
    };
  };
};
