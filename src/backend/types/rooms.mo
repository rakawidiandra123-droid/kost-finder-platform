import Storage "mo:caffeineai-object-storage/Storage";
import Common "../types/common";

module {
  public type RoomId = Common.RoomId;

  public type RoomType = {
    #putra;
    #putri;
    #campur;
  };

  public type RoomStatus = {
    #available;
    #occupied;
  };

  public type Room = {
    id : RoomId;
    name : Text;
    roomType : RoomType;
    monthlyPrice : Nat;
    description : Text;
    facilities : [Text];
    status : RoomStatus;
    photos : [Storage.ExternalBlob];
  };

  public type RoomFilter = {
    keyword : ?Text;
    roomType : ?RoomType;
    minPrice : ?Nat;
    maxPrice : ?Nat;
  };

  public type RoomInput = {
    name : Text;
    roomType : RoomType;
    monthlyPrice : Nat;
    description : Text;
    facilities : [Text];
    status : RoomStatus;
    photos : [Storage.ExternalBlob];
  };
};
