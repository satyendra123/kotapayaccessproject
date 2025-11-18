<?php

include('config/config.php');

date_default_timezone_set("Asia/Kolkata");

if (strlen($_SESSION['usernameis']) == 0) {
  header('location:index.php');
} else {
  $usernameis = $_SESSION['usernameis'];
  $usertype = $_SESSION['usertype'];
  $userid = $_SESSION['userid'];
    
  
  if(strlen($_SESSION['extracombo_customerid']) !=0)
	  $_SESSION['extracombo_customerid'] ='';
  

    if(strlen($_SESSION['shiftid']) == 0)
    {
      echo '<script>alert("Shift not found! Please select shift and GO AHEAD.")</script>';
      echo "<script type='text/javascript'> document.location = 'welcome-shifts.php'; </script>";
    }

    $shiftId = $_SESSION['shiftid'];
    
  // Ticket Clear
  if (isset($_GET['cancel'])) {
    $_SESSION['customerid'] = '';
    echo
    "<script>
        document.location.href = 'add-customer-ticket.php';
      </script>
      ";
  }
  
  if($_SESSION['print_check'] == '2')
  {
	   //echo '<script>alert("Print found 2, All clear.")</script>';
	   $_SESSION['customerid'] = '';
	   $_SESSION['print_check'] = '';
		echo
		"<script>
			document.location.href = 'add-customer-ticket.php';
		  </script>
		  ";
  }
  
  if($_SESSION['print_check'] == '1')
  {
	   //echo '<script>alert("Print found 1, now updating 2.")</script>';
	   $_SESSION['print_check'] = '2';
  }

  // Submit Ticket
  if (isset($_POST['submit'])) {
    // Radio Selected Ticket for
    if (isset($_POST['ticketfor'])) {
        $ticketfor = $_POST['ticketfor'];
    }
    
    $customername = $_POST['customername'];
    if (empty($_POST['aadharcard'])) {
        $aadharcard = "";
    } else {
        $aadharcard = $_POST['aadharcard'];
    }

    // Check discount is applied or not
    $isDiscountApplied = 'No'; // Yes / No
    $how_discountapplied = $_POST['discount_applied']; 
    if ($how_discountapplied != '0') {
        $isDiscountApplied = 'Yes';
    } else {
        $isDiscountApplied = 'No';
    }

    $mobileno = $_POST['mobileno'];
    $totalmembers = $_POST['totalmembers'];
    $ticktprice = $_POST['ticktprice'];   
    $comboservice_price = $_POST['comboservice_price']; 
    $grandtotal_price = $_POST['grandtotal_price'];
    $is_ticket_free_paid = "Paid";
    $date = date("d");
    $time = date("His");
    $random = rand(1234567, 9876521);
    $Ticket_number = $date . $time . $random;
    $Qrcode = base64_encode($Ticket_number);
    $shift = $_SESSION['shiftname'];
    $tickt_gen_date_time = date("Y-m-d H:i:s");

    // Check if the same record exists
    $sql_check = "SELECT id FROM customerticket 
                  WHERE ticket_gen_for = :ticket_gen_for 
                  AND customer_name = :customer_name 
                  AND mobile_no = :mobile_no 
                  AND no_of_members = :no_of_members 
                  AND total_service_price = :total_service_price 
                  AND grand_total = :grand_total 
                  AND tickt_gen_date_time = :tickt_gen_date_time 
                  AND tickt_gen_by = :tickt_gen_by";
    
    $db = getDb();
    $query_check = $db->prepare($sql_check);
    $query_check->bindParam(':ticket_gen_for', $ticketfor, PDO::PARAM_STR);
    $query_check->bindParam(':customer_name', $customername, PDO::PARAM_STR);
    $query_check->bindParam(':mobile_no', $mobileno, PDO::PARAM_STR);
    $query_check->bindParam(':no_of_members', $totalmembers, PDO::PARAM_STR);
    $query_check->bindParam(':total_service_price', $ticktprice, PDO::PARAM_STR);
    $query_check->bindParam(':grand_total', $grandtotal_price, PDO::PARAM_STR);
    $query_check->bindParam(':tickt_gen_date_time', $tickt_gen_date_time, PDO::PARAM_STR);
    $query_check->bindParam(':tickt_gen_by', $userid, PDO::PARAM_STR);
    $query_check->execute();

    // If a record exists, show an alert
    if ($query_check->rowCount() > 0) {
        echo '<script>alert("This ticket has already been generated for this customer. Ticket Number: '.$Ticket_number.' and Customer Name: '.$customername.'")</script>';        
        echo "<script type='text/javascript'> document.location = 'add-customer-ticket.php'; </script>";
    } else {
        // If no record exists, insert the new ticket
        $sql = "INSERT INTO customerticket(ticket_gen_for, ticket_number, customer_name, aadhar_no, mobile_no, no_of_members, total_service_price, total_combo_prices, isDiscountApplied, how_discountapplied, grand_total, qr_code, tickt_gen_date_time, tickt_gen_by, is_ticket_free_paid, ticket_generated_shift, ticket_scan_cnts, ticket_scanned_entryat, ticket_scanned_exitat) 
                VALUES(:ticket_gen_for, :ticket_number, :customer_name, :aadhar_no, :mobile_no, :no_of_members, :total_service_price, :total_combo_prices, :isDiscountApplied, :how_discountapplied, :grand_total, :qr_code, :tickt_gen_date_time, :tickt_gen_by, :is_ticket_free_paid, :ticket_generated_shift, :ticket_scan_cnts, :ticket_scanned_entryat, :ticket_scanned_exitat)";
        $query = $db->prepare($sql); 
        $query->bindParam(':ticket_gen_for', $ticketfor, PDO::PARAM_STR);
        $query->bindParam(':ticket_number', $Ticket_number, PDO::PARAM_STR);
        $query->bindParam(':customer_name', $customername, PDO::PARAM_STR);
        $query->bindParam(':aadhar_no', $aadharcard, PDO::PARAM_STR);
        $query->bindParam(':mobile_no', $mobileno, PDO::PARAM_STR);
        $query->bindParam(':no_of_members', $totalmembers, PDO::PARAM_STR);
        $query->bindParam(':total_service_price', $ticktprice, PDO::PARAM_STR);
        $query->bindParam(':total_combo_prices', $comboservice_price, PDO::PARAM_STR);
        $query->bindParam(':isDiscountApplied', $isDiscountApplied, PDO::PARAM_STR);
        $query->bindParam(':how_discountapplied', $how_discountapplied, PDO::PARAM_STR);
        $query->bindParam(':grand_total', $grandtotal_price, PDO::PARAM_STR);
        $query->bindParam(':qr_code', $Qrcode, PDO::PARAM_STR);
        $query->bindParam(':tickt_gen_date_time', $tickt_gen_date_time, PDO::PARAM_STR);
        $query->bindParam(':tickt_gen_by', $userid, PDO::PARAM_STR);
        $query->bindParam(':is_ticket_free_paid', $is_ticket_free_paid, PDO::PARAM_STR);
        $query->bindParam(':ticket_generated_shift', $shift, PDO::PARAM_STR);
        $query->bindParam(':ticket_scan_cnts', $totalmembers, PDO::PARAM_STR);
        $query->bindParam(':ticket_scanned_entryat', $totalmembers, PDO::PARAM_STR);
        $query->bindParam(':ticket_scanned_exitat', $totalmembers, PDO::PARAM_STR);
        $query->execute();

        $customerid = $db->lastInsertId();
        if ($customerid) {
            $_SESSION['customerid'] = $customerid;
            $_SESSION['print_check'] = '1';
			
            
            // Insert selected combos if available
            if (!empty($_POST['selectedservicecombos'])) {
                $combo_with_extra = "with";
                $selectedservicecombos = $_POST["selectedservicecombos"];
                for ($aCntr = 0; $aCntr < count($selectedservicecombos); $aCntr++) {
                    if (!empty($selectedservicecombos[$aCntr])) {
                        $array = (explode(",", $selectedservicecombos[$aCntr]));
                        $comboid = $array['0'];
                        $price = $array['1'];    
                        $sql = "INSERT INTO customer_combo(customer_id, combo_id, price, date_time, combo_with_extra)
                                VALUES(:customer_id, :combo_id, :price, :date_time, :combo_with_extra)";
                        $query = $db->prepare($sql);
                        $query->bindParam(':customer_id', $customerid, PDO::PARAM_STR);
                        $query->bindParam(':combo_id', $comboid, PDO::PARAM_STR);
                        $query->bindParam(':price', $price, PDO::PARAM_STR);
                        $query->bindParam(':date_time', $tickt_gen_date_time, PDO::PARAM_STR);
                        $query->bindParam(':combo_with_extra', $combo_with_extra, PDO::PARAM_STR);
                        $query->execute();
                    }
                }
            }
            echo '<script>alert("Ticket Created, Please click on Print button and print the ticket.")</script>';
            echo "<script type='text/javascript'> document.location = 'add-customer-ticket.php'; </script>";
        }
    }
}


}

?>


<!doctype html>
<html lang="en">

<head>

  <meta charset="utf-8" />
  <title>Dashboard | Smart Pay Access System | Houston Systems</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta content="Premium Multipurpose Admin & Dashboard Template" name="description" />
  <meta content="Themesbrand" name="author" />
  <!-- App favicon -->
  <link rel="shortcut icon" href="assets/images/favicon.ico">

  <!-- plugin css -->
  <link href="assets/libs/admin-resources/jquery.vectormap/jquery-jvectormap-1.2.2.css" rel="stylesheet" type="text/css" />

  <!-- preloader css -->
  <link rel="stylesheet" href="assets/css/preloader.min.css" type="text/css" />

  <!-- Bootstrap Css -->
  <link href="assets/css/bootstrap.min.css" id="bootstrap-style" rel="stylesheet" type="text/css" />
  <!-- Icons Css -->
  <link href="assets/css/icons.min.css" rel="stylesheet" type="text/css" />
  <!-- App Css-->
  <link href="assets/css/app.min.css" id="app-style" rel="stylesheet" type="text/css" />

  <!-- QRCode Generator -->
  <script type="text/javascript" src="assets/js/qrcode.js"></script>

  <?php include('include/header.php'); ?>

  <script>
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        alert('Manually Printing is disabled');
      }
    });
  </script>

<style>
        @keyframes borderAnimation {
            0% {
                border-color: red;
            }
            25% {
                border-color: yellow;
            }
            50% {
                border-color: green;
            }
            75% {
                border-color: blue;
            }
            100% {
                border-color: red;
            }
        }

        .animated-border {
            border: 4px solid;
            animation: borderAnimation 4s infinite;
            padding: 20px;
        }

        .center-text {
            text-align: center;
        }

        .margin-top {
            margin-top: 0.5rem;
        }

        .text-green {
            color: green;
        }

        .button {
            padding: 0.5rem 1rem;
            border: none;
            cursor: pointer;
        }

        .button-small {
            padding: 0.25rem 0.5rem;
            font-size: 0.875rem;
        }

        .background-green {
            background-color: green;
        }

        .background-blue {
            background-color: #26b5e4;
        }

        .text-white {
            color: white;
        }

        .float-right {
            float: right;
        }

        .disabled {
            background-color: grey !important;
            cursor: not-allowed;
        }
    </style>

</head>

<body>

  <!-- <body data-layout="horizontal"> -->

  <!-- Begin page -->
  <div id="layout-wrapper">
    <div class="vertical-menu">

      <div data-simplebar class="h-100">

        <!--- Sidemenu -->
        <div id="sidebar-menu">
          <!-- ========== Left Sidebar Start ========== -->
          <?php include('include/sidebar.php'); ?>

          <!-- Left Sidebar End -->
        </div>

      </div>

    </div>
    <div class="main-content">
      <div class="page-content">
        <div class="container-fluid">

          <div class="row">
            <div class="col-lg-6">
              <div class="card bg-primary text-white">
                <div class="card-body" style="height: auto;">
                  <a href="extra-combo-tickets.php" class="btn btn-sm bg-danger text-white float-right">+ Extra Combo's Ticket</a><br>
                  <h4 class="card-title">Ticket Generation For?</h4>

                  <form class="forms-sample" method="POST">
                    <div class="row">

                      <div class="form-group col-lg-3 text-center mt-1">
                        <input type="radio" id="student" name="ticketfor" value="Student" onclick="CalculatePrice()" style="cursor:pointer;">
                        <label for="student" class="text-danger" style="cursor:pointer;"><b>STUDENT</b></label>
                      </div>
                      <div class="form-group col-lg-3 text-center mt-1">
                        <input type="radio" id="studentgroup" name="ticketfor" value="Student Group" onclick="CalculatePrice()" style="cursor:pointer;">
                        <label for="studentgroup" class="text-danger" style="cursor:pointer;"><b>STUDENT GROUP</b></label>
                      </div>
                      <div class="form-group col-lg-3 text-center mt-1">
                        <input type="radio" id="foreignvisitor" name="ticketfor" value="Foreign Visitor" onclick="CalculatePrice()" style="cursor:pointer;">
                        <label for="foreignvisitor" class="text-danger" style="cursor:pointer;"><b>FOREIGN</b></label>
                      </div>
                      <div class="form-group col-lg-3 text-center mt-1">
                        <input type="radio" id="indianvisitor" name="ticketfor" value="Indian Visitor" onclick="CalculatePrice()" style="cursor:pointer;" checked>
                        <label for="indianvisitor" class="text-success" style="cursor:pointer;"><b>INDIAN</b></label>
                      </div>
                      <div class="form-group col-lg-3 text-center mt-1">
                        <input type="radio" id="prewedding" name="ticketfor" value="Pre Wedding" onclick="CalculatePrice()" style="cursor:pointer;">
                        <label for="prewedding" class="text-success" style="cursor:pointer;"><b>PRE-WEDDING</b></label>
                      </div>
                      <div class="form-group col-lg-3 text-center mt-1">
                        <input type="radio" id="indianwithgolfcart" name="ticketfor" value="Indian Golf Cart" onclick="CalculatePrice()" style="cursor:pointer;">
                        <label for="indianwithgolfcart" class="text-success" style="cursor:pointer;"><b>INDIAN (GOLF CART)</b></label>
                      </div>
                      <hr>
                      <div class="form-group col-lg-6 mt-2">
                        <label>Customer Name <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" name="customername" id="customername" placeholder="Enter Customer Name" autocomplete="off" required>
                      </div>

                      <div class="form-group col-lg-6 mt-2">
                        <label>Aadhar No <span class="text-danger">(Optional)</span></label>
                        <input type="text" oninput="this.value = this.value.replace(/[^0-9]/g, '').replace(/(\..*?)\..*/g, '$1');" class="form-control" name="aadharcard" placeholder="Enter Aadhar No." autocomplete="off"/>
                      </div>

                      <div class="form-group col-lg-6 mt-2">
                        <label>Mobile Number <span class="text-danger">*</span></label>
                        <input type="text" oninput="this.value = this.value.replace(/[^0-9]/g, '').replace(/(\..*?)\..*/g, '$1');" class="form-control" name="mobileno" placeholder="Enter Mobile No." autocomplete="off" required/>
                      </div>

                      <div class="form-group col-lg-6 mt-2">
                        <label>No. of Members <span class="text-danger">*</span></label>
                        <input type="text" oninput="this.value = this.value.replace(/[^0-9]/g, '').replace(/(\..*?)\..*/g, '$1');" class="form-control" value="1" id="totalmembers" name="totalmembers" placeholder="Enter Total Members" autocomplete="off" required/>
                      </div>

                      <div class="col-lg-12 mt-2">
                        <div class="card">
                          <div class="card-body">
                            <h4 class="card-title text-info">Services Combo </h4>
                            <div class="row">
                              <?php $sql = "SELECT id, combo_service, discountedprice FROM combo_services WHERE status='Active' AND shift = '$shiftId'";
                                $db = getDb();
                                $query = $db->prepare($sql);
                                $query->execute();
                                $results = $query->fetchAll(PDO::FETCH_OBJ);
                                if ($query->rowCount() > 0) {
                                  foreach ($results as $result_service_combo) {
                                ?>
                                    <div class="col-lg-3 text-dark">
                                      <div class="form-check form-check-flat form-check-danger">
                                        <label class="form-check-label">
                                          <input type="checkbox" name="selectedservicecombos[]" onclick="CalculateServiceComboPrice()" class="form-check-input" value="<?php echo $result_service_combo->id . ',' . $result_service_combo->discountedprice; ?>" onclick='handleClick(this);'> <?php echo $result_service_combo->combo_service . ' (Rs.' . $result_service_combo->discountedprice . ')'; ?> &nbsp;&nbsp; </label>
                                      </div>
                                    </div>
                                <?php }
                                } ?>
                            </div>

                          </div>
                        </div>
                      </div>
                      

                      <div class="col-lg-12">
                        <div class="card">
                          <div class="card-body">
                            <h4 class="card-title text-danger">TOTAL CALCULATION PRICE</h4>
                            <div class="row">
                              <div class="col-lg-6">
                                <span>
                                  <div class="form-check form-check-flat form-check-success text-center" style="align:center; background-color: #d1d1d1; width: 100%; border-radius: 70%; font-size: 20px; margin: 10px 10px 10px 10px;">
                                    <label class="form-check-label">
                                      <input type="checkbox" name="foc" id="foc" onclick="foc_ticket()" class="form-check-input" value="0"> FOC Ticket &nbsp;&nbsp; </label>
                                  </div>
                                </span>
                                <textarea class="form-control" name="focreason" id="focreason" cols="30" rows="3" placeholder="Enter FOC Ticket Reason" required></textarea>
                                
                                
                                <div class="row center-text animated-border">
                                    <h5 class="margin-top text-green"><u>APPLY DISCOUNT</u></h5>
                                    <div class="col-lg-6">
                                        <button id="25discount" class="button button-small background-green text-white float-right">Apply 25% Discount</button>
                                    </div>
                                    <div class="col-lg-6">
                                        <button id="50discount" class="button button-small background-blue text-white float-right">Apply 50% Discount</button>
                                    </div>
                                </div>

                              </div>

                              <div class="col-lg-6">
                                <div class="row">
                                  <div class="col-lg-12 text-center">
                                    <h5><b class="text-danger"><label id="selectedOptionLabel">Ticket Price: </label></b><br><b><span id="ticketprice"> 0 </span></b></h5>
                                    <h5><b class="text-success"><label>Combo Services Price </label></b><br><b><span id="comboservicesprice"> Rs. 0 </span></b></h5>
                                    <h5><b class="text-success"><label>Discount Applied: </label></b><b><span id="discount_appliedis"> 0% </span></b></h5>
                                    <h5><b class="text-success"><label>Grand Total: </label></b><b><span id="grandtotalpriceis"> Rs. 0 </span></b></h5>
                                    <input type="hidden" id="comboservicespriceis" value="0" name="comboservice_price"> <!-- Combo Price -->
                                    <input type="hidden" id="discountapplied" value="0" name="discount_applied"> <!-- Discount Applied -->
                                    <input type="hidden" id="grandtotalprice" value="0" name="grandtotal_price"> <!-- Grand Total Price -->
                                  </div>
                                </div>
                              </div>
                            </div>

                          </div>
                        </div>
                      </div>

                      <div class="col-lg-6 mt-3 text-center">
                        <button type="submit" class="btn btn-lg btn-info btn-lg btn-block mt-2" id="submit_ticket" name="submit" onclick="showPrintButton()">Submit Ticket Details</button>
                      </div>

                      <div class="col-lg-3 mt-3 text-center">
                        <button type="button" id="printbtn" onclick="PrintMe('printme')" class="btn btn-sm btn-success btn-lg btn-block mt-2" <?php if(empty($_SESSION['customerid'])) echo 'hidden'; ?>>Print Ticket</button>
                      </div>

                      <div class="col-lg-3 mt-3 text-center">
                        <a href="add-customer-ticket.php?cancel=cancel" <?php if(empty($_SESSION['customerid'])) echo 'hidden'; ?> class="btn btn-sm btn-danger btn-lg btn-block mt-2" onclick="return confirm('Are you sure, you want to cancel this ticket?')">
                          Clear Ticket</a>
                      </div>

                    </div>
                  </form>

                </div>
              </div>
            </div>


            <?php
              if (!empty($_SESSION['customerid'])) {
                $customerid_is = $_SESSION['customerid'];
                $sql = "SELECT id, ticket_gen_for, ticket_number, customer_name, aadhar_no, mobile_no, no_of_members, ticket_generated_shift, 
                  qr_code, tickt_gen_date_time, grand_total FROM customerticket 
                  WHERE id = '$customerid_is'";
                $db = getDb();
                $query = $db->prepare($sql);
                $query->execute();
                $result = $query->fetch(PDO::FETCH_OBJ);
                $db = null;
                $array = (explode(" ", $result->tickt_gen_date_time));
                $ticket_date = $array['0'];
                $ticket_time = $array['1'];
              }
            ?>

            <input type="hidden" id="qrcodeis" value="<?php echo $result->qr_code; ?>">
            <div class="col-lg-6">
              <div id="fullscreen">
                <div class="row" id="printme">
                  <div class="col-lg-12 mb-2 ml-2 mr-2">
                    <div class="card text-left">
                      <div class="card-body shadow-lg p-3 ">
                        <div class="row">

                          <div class="col-lg-12 text-center mt-3">
                            <img src="<?php echo $_SESSION['settings_logo']; ?>" alt="logo">
                          </div>

                          <div class="col-lg-12 text-center mt-3">
                            <h5 class="text-danger">
                              <?php echo $_SESSION['printbrandname']; ?>
                            </h5>
                          </div>

                          <div style="margin-top: 14px;" class="text-center mt-3">
                            <div style="margin-top: 8px;"><b>Date Time: </b>
                              <?php echo $ticket_date.' '.$ticket_time; ?>
                            </div>
                            <div style="margin-top: 8px;" class="text-center mt-3 mb-3"><b>
                                <?php if (!empty($result->aadhar_no))
                                  echo 'Aadhar Card:';
                                else {
                                  echo 'Mobile No:';
                                } ?>
                              </b>
                              <?php if (!empty($result->aadhar_no))
                                echo $result->aadhar_no;
                              else
                                echo $result->mobile_no; ?>
                            </div>

                            <div style="margin-top: 8px;" class="text-center mt-3"><b>Shift: </b>
                              <?php echo $result->ticket_generated_shift; ?>
                            </div>

                            <div style="margin-top: 8px;" class="text-center mt-3"><b>Ticket For: </b>
                              <?php if($result->ticket_gen_for == 'Indian Golf Cart') echo 'Indian With Golf Cart'; else echo $result->ticket_gen_for; ?>
                            </div>

                            <div style="margin-top: 8px;" class="text-center mt-3"><b>Members: </b> <?php echo $result->no_of_members; ?>  ,  <b>Price: </b>
                              <?php echo $result->grand_total; ?>
                            </div>

                            <?php $sql = "SELECT combo_services.combo_service FROM customer_combo
                                          INNER JOIN combo_services ON combo_services.id = customer_combo.combo_id
                                          WHERE customer_combo.customer_id= '$customerid_is'";
                              $db = getDb();
                              $query = $db->prepare($sql);
                              $query->execute();
                              $results_combos = $query->fetchAll(PDO::FETCH_OBJ);
                                if ($query->rowCount() > 0) 
                                {
                                  echo '<div style="margin-top: 8px;" class="text-center mt-3"><b>Combos: </b>';
                                    foreach ($results_combos as $result_combos) 
                                    {
                                      echo $result_combos->combo_service.', ';
                                    }
                                  echo '</div>';
                                } 
                            ?>                            

                            <div class="row text-center" style="margin-top: 20px;">
                              <div class="col-4"></div>
                              <div class="col-5">
                                <div class="container-fluid">
                                  <div class="text-center">
                                    <div id="qrResult"></div>
                                  </div>
                                </div>
                                <div style="text-align:center; color:black;"></div>
                              </div>
                            </div>

                            <div class="row text-center" style="margin-top: 8px;">
                              <span class="font-weight-bold">Ticket No:
                                <?php echo $result->ticket_number; ?>
                              </span>
                            </div>

                            <div class="row text-center" style="margin-top: 35px; margin-left:5%; margin-right:5%;">
                              <div class="font-weight-bold col-lg-12">
                                <h4>Please do not fold the QR code</h4>
                              </div>
                            </div>


                          </div>

                        </div>

                      </div>

                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  </div>
  <!-- container-fluid -->
  </div>
  <!-- End Page-content -->


  <?php include('include/footer.php'); ?>
  </div>


  </div>


  <!-- END layout-wrapper -->


  <!-- Right Sidebar -->
  <?php include('include/rightbar.php'); ?>
  <!-- /Right-bar -->

  <!-- Right bar overlay-->
  <!-- <div class="rightbar-overlay"></div> -->

  <!-- JAVASCRIPT -->
  <script src="assets/libs/jquery/jquery.min.js"></script>
  <script src="assets/libs/bootstrap/js/bootstrap.bundle.min.js"></script>
  <script src="assets/libs/metismenu/metisMenu.min.js"></script>
  <script src="assets/libs/simplebar/simplebar.min.js"></script>
  <script src="assets/libs/node-waves/waves.min.js"></script>
  <script src="assets/libs/feather-icons/feather.min.js"></script>
  <!-- pace js -->
  <script src="assets/libs/pace-js/pace.min.js"></script>

  <!-- apexcharts -->
  <script src="assets/libs/apexcharts/apexcharts.min.js"></script>

  <!-- Plugins js-->
  <script src="assets/libs/admin-resources/jquery.vectormap/jquery-jvectormap-1.2.2.min.js"></script>
  <script src="assets/libs/admin-resources/jquery.vectormap/maps/jquery-jvectormap-world-mill-en.js"></script>
  <!-- dashboard init -->
  <script src="assets/js/pages/dashboard.init.js"></script>

  <script src="assets/js/app.js"></script>

  <script src="assets/js/close-noactivity.js"></script>

  <script language="javascript">
    function PrintMe(DivID) {
		
		// Hide the print button with id "printbtn"
        document.getElementById("printbtn").style.display = "none";
		// Clear the customerid session update	
		
		
		// alert('Print disable and hidden calling...');
		
      // Number of copies you want to print
      var numCopies = 3; // Change this to the desired number of copies

      for (var i = 0; i < numCopies; i++) {
      // Open a new window for each copy

        var disp_setting = "toolbar=yes,location=no,";
        disp_setting += "directories=yes,menubar=yes,";
        disp_setting += "scrollbars=yes,width=650, height=600, left=100, top=25";
        var content_vlue = document.getElementById(DivID).innerHTML;
        var docprint = window.open("", "", disp_setting);
        docprint.document.open();
        docprint.document.write('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"');
        docprint.document.write('"http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">');
        docprint.document.write('<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">');
        docprint.document.write('<head><title>Pay Access Ticket Pass</title>');
        docprint.document.write('<style type="text/css">body{ margin:0px;');
        docprint.document.write('font-family:verdana,Arial;color:#000;');
        docprint.document.write('font-family:Verdana, Geneva, sans-serif; font-size:12px;}');
        docprint.document.write('a{color:#000;text-decoration:none;} </style>');
        docprint.document.write('</head><body onLoad="self.print()"><center>');
        docprint.document.write(content_vlue);
        docprint.document.write('</center></body></html>');
        docprint.document.close();
        docprint.focus();

      }
      
    }
  </script>

  <script type="text/javascript">
    function print_page() {		
      var input_cust_id = document.getElementById("customerid");
      input_cust_id.style.visibility = "hidden";
      window.print();
    }
  </script>

  <script>
    var elem = document.getElementById("fullscreen");

    function openFullscreen() {
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        /* Firefox */
        elem.mozRequestFullScreen();
      } else if (elem.webkitRequestFullscreen) {
        /* Chrome, Safari & Opera */
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        /* IE/Edge */
        elem.msRequestFullscreen();
      }
    }
  </script>


  <script>
    // alert('Calling sc');
    document.getElementById("focreason").disabled = true;

    function totalservicecost() {
      // alert('Calling totalservicecost()');

      var discount = 0;
      if (document.getElementById('normal').checked) {
        // alert('Calling normal');
        var getSelectedForTicket = document.getElementById("normal").value;
      } else if (document.getElementById('student').checked) {
        var getSelectedForTicket = document.getElementById("student").value;
        // alert('Calling student');
      }

      if (getSelectedForTicket == "student") {
        var discount = document.getElementById("student_discount").value; // Read student discount 
        // alert('Calling student: ' + discount);
      }

      // Services Read and calculate - start 
      var input_services = document.getElementsByName("selectedservices[]");
      var total_serv_price = 0;
      for (var i = 0; i < input_services.length; i++) {
        if (input_services[i].checked) {
          // str = str.split(",").pop();
          // console.log('Before: '+input_services[i].value);
          str = input_services[i].value.toString().split(",").pop();
          // console.log('After: ' + str);
          total_serv_price += parseFloat(str);
        }
      }
      document.getElementById("totalservices_input").value = total_serv_price.toFixed(0); // set in input - services total price
      document.getElementById("services_price").innerHTML = total_serv_price.toFixed(0); // set in span - services total price
      // Services Read and calculate - end 

      // Combos Read and calculate - start 
      var input_combos = document.getElementsByName("selectedcombos[]");
      var total_combo_price = 0;
      for (var i = 0; i < input_combos.length; i++) {
        if (input_combos[i].checked) {
          // str = str.split(",").pop();
          // console.log('Before: '+input_combos[i].value);
          str = input_combos[i].value.toString().split(",").pop();
          // console.log('After: ' + str);
          total_combo_price += parseFloat(str);
        }
      }
      document.getElementById("totalcombos_input").value = total_combo_price.toFixed(0); // set in input - combos total price
      document.getElementById("combos_price").innerHTML = total_combo_price.toFixed(0); // set in span - combos total price
      // Combos Read and calculate - end //

      // Read services Price
      var total_services_price = document.getElementById("totalservices_input").value; // Read  services total price
      var total_combos_price = document.getElementById("totalcombos_input").value; // Read  Combos total price
      var grand_total_price = parseInt(total_services_price) + parseInt(total_combos_price);

      if (getSelectedForTicket == "student") {
        // var grand_total_discount_price = "0";
        // alert('Sevices Price leng: ' + total_services_price.length + ', Sevices Combo leng: ' + total_combos_price.length);
        // if ((total_services_price.length > 1) && (total_combos_price.length > 1)) {
        //   alert('total_services_combo price found');
        //   grand_total_discount_price = parseInt(total_services_price) + parseInt(total_combos_price) * ((100 - parseInt(discount)) / 100);
        // } else if ((total_services_price.length > 1)) {
        //   alert('total_services_price found: ' + total_services_price);
        //   grand_total_discount_price = parseInt(total_services_price) * ((100 - parseInt(discount)) / 100);
        //   alert('grand_total_discount_price found: ' + grand_total_discount_price);

        // } else if ((total_combos_price.length > 1)) {
        //   alert('total_combos_price found');
        //   grand_total_discount_price = parseInt(total_combos_price) * ((100 - parseInt(discount)) / 100);
        // }

        // alert('Calling getSelectedForTicket: ' + total_services_price + ', Calling Combo: ' + total_combos_price);

        var grand_total_discount_price = parseInt(total_services_price) + parseInt(total_combos_price) * ((100 - parseInt(discount)) / 100); // working with combo select and service select
        // var grand_total_discount_price = parseInt(total_services_price) + parseInt(total_combos_price) - parseInt(discount);
        document.getElementById("grand_total_price").innerHTML = 'Rs.' + Math.floor(grand_total_discount_price); // Set Grand Price span
        document.getElementById("grandtotal_input").value = Math.floor(grand_total_discount_price); // Set Grand Price input
      } else {
        document.getElementById("grand_total_price").innerHTML = grand_total_price; // Set Grand Price span
        document.getElementById("grandtotal_input").value = grand_total_price; // Set Grand Price input
      }
      // alert(grand_total_price);
      foc_ticket();
    }

    function CalculatePrice() {
      var normal = document.getElementById("normal");
      var student = document.getElementById("student");

      // Read services Price
      var total_services_price = document.getElementById("totalservices_input").value; // Read  services total price
      var total_combos_price = document.getElementById("totalcombos_input").value; // Read  Combos total price
      var grand_total_price = parseInt(total_services_price) + parseInt(total_combos_price);

      if (normal.checked) {
        document.getElementById("discount_applied").innerHTML = 'Discount Applied - 0%';
        document.getElementById("grand_total_price").innerHTML = grand_total_price; // Set Grand Price span
        document.getElementById("grandtotal_input").value = grand_total_price; // Set Grand Price input
      } else if (student.checked) {
        var discount = document.getElementById("student_discount").value; // Read student discount 
        document.getElementById("discount_applied").innerHTML = 'Discount Applied - ' + discount + '%';

        var grand_total_discount_price = "0";
        // alert('Sevices Price leng: ' + total_services_price.length + ', Sevices Combo leng: ' + total_combos_price.length);
        if ((total_services_price.length > 1) && (total_combos_price.length > 1)) {
          // alert('total_services_combo price found');
          grand_total_discount_price = parseInt(total_services_price) + parseInt(total_combos_price) * ((100 - parseInt(discount)) / 100);
        } else if ((total_services_price.length > 1)) {
          // alert('total_services_price found: ' + total_services_price);
          grand_total_discount_price = parseInt(total_services_price) * ((100 - parseInt(discount)) / 100);
          // alert('grand_total_discount_price found: ' + grand_total_discount_price);

        } else if ((total_combos_price.length > 1)) {
          // alert('total_combos_price found');
          grand_total_discount_price = parseInt(total_combos_price) * ((100 - parseInt(discount)) / 100);
        }

        // alert('Calling getSelectedForTicket: ' + total_services_price + ', Calling Combo: ' + total_combos_price);

        // var grand_total_discount_price = parseInt(total_services_price) + parseInt(total_combos_price) - parseInt(discount);
        // var grand_total_discount_price = parseInt(grand_total_price) * ((100 - parseInt(discount)) / 100);
        document.getElementById("grand_total_price").innerHTML = Math.floor(grand_total_discount_price); // Set Grand Price span
        document.getElementById("grandtotal_input").value = Math.floor(grand_total_discount_price); // Set Grand Price input
      }
    }

    function foc_ticket() {
      var checkbox = document.getElementById('foc');
      if (checkbox.checked == true) {
        document.getElementById("focreason").disabled = false;
        document.getElementById("grand_total_price").innerHTML = 0; // Set Grand Price span
        document.getElementById("grandtotal_input").value = 0;
        document.getElementById("discount_applied").innerHTML = 'Discount Applied - 100%';
      } 
      else {
        document.getElementById("focreason").disabled = true;
        CalculatePrice();
      }
    }
  </script>


  <script type="text/javascript">
    var qrcode = new QRCode(document.getElementById('qrResult'), {
      width: 150,
      height: 150
    });

    var message = document.getElementById('qrcodeis');
    qrcode.makeCode(message.value);
  </script>

  <script>
    // Get references to the radio buttons and the label
    const student = document.getElementById('student'); 
    const studentgroup = document.getElementById('studentgroup'); 
    //const kotacitizen = document.getElementById('kotacitizen');
    const foreignvisitor = document.getElementById('foreignvisitor');
    const indianvisitor = document.getElementById('indianvisitor');
    const prewedding = document.getElementById('prewedding');
    const indianwithgolfcart = document.getElementById('indianwithgolfcart');        
    const selectedOptionLabel = document.getElementById('selectedOptionLabel');

    var selected_checkBox = "";

    // Function to update the label when a radio button is selected
    function updateSelectedOption() {
        if (student.checked) {
            selectedOptionLabel.textContent = 'Ticket Price For: ' + student.value;
            call_ticketprice(student.value);
            selected_checkBox = student.value;
            // alert('calling: '+student.value);              
        } else if (studentgroup.checked) {
            selectedOptionLabel.textContent = 'Ticket Price For: ' + studentgroup.value;
            call_ticketprice(studentgroup.value);
            selected_checkBox = studentgroup.value;
            // alert('calling: '+student.value);
        } 
        //  else if (kotacitizen.checked) {
        //      selectedOptionLabel.textContent = 'Ticket Price For: ' + kotacitizen.value;
        //      call_ticketprice(kotacitizen.value);
        //      selected_checkBox = kotacitizen.value;
        //      // alert('calling: '+kotacitizen.value);
        //  } 
        else if (foreignvisitor.checked) {
            selectedOptionLabel.textContent = 'Ticket Price For: ' + foreignvisitor.value;
            call_ticketprice(foreignvisitor.value);
            selected_checkBox = foreignvisitor.value;
            // alert('calling: '+foreignvisitor.value);
        } else if (indianvisitor.checked) {
            selectedOptionLabel.textContent = 'Ticket Price For: ' + indianvisitor.value;
            call_ticketprice(indianvisitor.value);
            selected_checkBox = indianvisitor.value;
            // alert('calling: '+indianvisitor.value);
        } else if (prewedding.checked) {
            selectedOptionLabel.textContent = 'Ticket Price For: ' + prewedding.value;
            call_ticketprice(prewedding.value);
            selected_checkBox = prewedding.value;
            // alert('calling: '+prewedding.value);
        } else if (indianwithgolfcart.checked) {
            selectedOptionLabel.textContent = 'Ticket Price For: ' + indianwithgolfcart.value;
            call_ticketprice(indianwithgolfcart.value);
            selected_checkBox = indianwithgolfcart.value;
            // alert('calling: '+prewedding.value);
        } else {
            selectedOptionLabel.textContent = 'Ticket Price For: ';
            selected_checkBox = '';
        }

        // alert('Selected checkBox: '+selected_checkBox);
    }

    // Add event listeners to the radio buttons to call the updateSelectedOption function
    student.addEventListener('change', updateSelectedOption);
    studentgroup.addEventListener('change', updateSelectedOption);        
    // kotacitizen.addEventListener('change', updateSelectedOption);
    foreignvisitor.addEventListener('change', updateSelectedOption);
    indianvisitor.addEventListener('change', updateSelectedOption);
    prewedding.addEventListener('change', updateSelectedOption);
    indianwithgolfcart.addEventListener('change', updateSelectedOption);
    // Initialize the label based on the initially selected radio button
    updateSelectedOption();

    function call_ticketprice(priceFor)
    {
      var total_members = document.getElementById("totalmembers").value; // Read total members
      // alert('Total Members: '+total_members);
      var priceFor = priceFor;    


      // Discounts Buttons Shown Accordingly! [only no. of members greater than 50 above or 100 above]
        // Default both buttons are disable
        $("#25discount").prop("disabled", true).addClass("disabled");
        $("#50discount").prop("disabled", true).addClass("disabled");

        // To enable the buttons again
        // Enable buttons based on total members
        if (total_members >= 50 && total_members < 100) {
            $("#25discount").prop("disabled", false).removeClass("disabled");
        }
        if (total_members >= 100) {
            $("#50discount").prop("disabled", false).removeClass("disabled");
        }

        if(total_members == 0)
        {
          $("#submit_ticket").hide();
          $("#printbtn").hide();
        }
        else
        {
          $("#submit_ticket").show();
          $("#printbtn").show();
        }

      $.ajax({
          method: "GET",
          url: "api/ticketprice.php",
          data: 
          {
            priceFor:priceFor,
            totalMembers:total_members
          },
          dataType: "html",
          success: function(data)
          {
              $("#ticketprice").html(data);

              // Read Ticket Price is
              var ticktprice = document.getElementById("ticktprice").value;
              // alert("Ticket Price is: "+ ticktprice);
              CalculateServiceComboPrice()
              // Update Combo Price * No. of members
              // var combo_price = document.getElementById("comboservicespriceis").value;
              // var combo_priceis = parseFloat(combo_price);
              // var total_membersis = parseFloat(total_members);
              // // Calculate the multiply by no. of members
              // var comboprice_calulated = combo_priceis * total_membersis;
              // document.getElementById("comboservicespriceis").value = comboprice_calulated;
          }
      });
    }
    

    $("#totalmembers").on("input", function() {
        var total_members = $(this).val();
          //CalculateServiceComboPrice();
          call_ticketprice(selected_checkBox);
    });


    function CalculateServiceComboPrice()
    {
      var ticktprice = document.getElementById("ticktprice").value; // Read Ticket Price
      var total_members = document.getElementById("totalmembers").value; // Read total members

      if(total_members === null || total_members === undefined || total_members === ""){
        total_members = 0;
        alert("Members not found.");
      }

      // Services Read and calculate - start 
      var input_services_combo = document.getElementsByName("selectedservicecombos[]");
      var total_serv_price = 0;
      for (var i = 0; i < input_services_combo.length; i++) {
        if (input_services_combo[i].checked) {
          // str = str.split(",").pop();
          // console.log('Before: '+input_services_combo[i].value);
          // alert('Before: '+input_services_combo[i].value);
          str = input_services_combo[i].value.toString().split(",").pop();
          // alert('After: ' + str);
          // console.log('After: ' + str);
          total_serv_price += parseFloat(str);
          // alert('Total Service combo price: ' + total_serv_price);
        }
      }
      
      var combo_priceis = parseFloat(total_serv_price);
      var total_membersis = parseFloat(total_members);
      // Calculate the multiply by no. of members
      var comboprice_calulated = combo_priceis * total_membersis;
      document.getElementById("comboservicespriceis").value = comboprice_calulated;
      document.getElementById("comboservicesprice").innerHTML = "Rs. "+comboprice_calulated;



      var tickt_price = parseFloat(ticktprice);
      var tickt_combo = parseFloat(comboprice_calulated);
      // Calculate the sum
      var sum = tickt_price + tickt_combo;

      // Display the sum in the result input field
      document.getElementById("grandtotalprice").value = sum;
      document.getElementById("grandtotalpriceis").innerHTML = "Rs. "+ sum;          

    }


    // Apply discounts on button click
    // Apply discounts on button click
    $("#25discount").click(function() {
        var grand_total = parseFloat($("#grandtotalprice").val());
        var discounted_price = grand_total * 0.75; // Apply 25% discount

        // Format the discounted price without trailing .00
        var formatted_price = discounted_price % 1 === 0 ? discounted_price.toFixed(0) : discounted_price.toFixed(2);

        $("#grandtotalprice").val(formatted_price);
        document.getElementById("grandtotalpriceis").innerHTML = "Rs. " + formatted_price;  
        $("#discountapplied").val("25%"); 
        document.getElementById("discount_appliedis").innerHTML = "25%"; 
        $("#25discount").prop("disabled", true).addClass("disabled");
    });


    $("#50discount").click(function() {
        var grand_total = parseFloat($("#grandtotalprice").val());
        var discounted_price = grand_total * 0.50; // Apply 50% discount

        // Format the discounted price without trailing .00
        var formatted_price = discounted_price % 1 === 0 ? discounted_price.toFixed(0) : discounted_price.toFixed(2);

        $("#grandtotalprice").val(formatted_price);
        document.getElementById("grandtotalpriceis").innerHTML = "Rs. " + formatted_price; 
        $("#discountapplied").val("50%"); 
        document.getElementById("discount_appliedis").innerHTML = "50%"; 
        $("#50discount").prop("disabled", true).addClass("disabled");
    });

  </script>

  <script type="text/javascript">
      function hidePrintButton() {
          // Hide the print button with id "printbtn"
          document.getElementById("printbtn").style.display = "none";
      }
  
      function showPrintButton() {
          // Show the print button with id "printbtn"
          document.getElementById("printbtn").style.display = "inline";
      }
  
  </script>


</body>


</html>
